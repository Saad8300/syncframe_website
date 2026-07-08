// src/components/admin/AppReleasesTab.tsx
// Admin App Releases management with robust TUS resumable upload for large installer files.

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as tus from 'tus-js-client'
import {
  Plus, Edit2, Trash2, Download, AlertCircle, CheckCircle2,
  Monitor, Apple, Star, Upload, X, FileText, Loader2,
  ExternalLink, RefreshCw, Eye, EyeOff, HardDrive, Link2,
  Pause, Play, XCircle
} from 'lucide-react'
import type { AppRelease } from './adminTypes'
import { supabase } from '../../lib/supabaseClient'

interface AppReleasesTabProps {
  releases: AppRelease[]
  loading: boolean
  onRefresh: () => void
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildStoragePath(platform: string, channel: string, version: string, arch: string, releaseId: string, uniqueId: string, fileName: string): string {
  const safeVersion = version.replace(/^v/i, '').replace(/\s+/g, '-')
  const safeArch = arch.replace(/\s+/g, '-')
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '-')
  return `${platform}/${channel}/${safeVersion}/${safeArch}/${releaseId}/${uniqueId}-${safeFileName}`
}

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  windows: ['.exe', '.zip', '.msi'],
  mac: ['.dmg', '.zip', '.pkg'],
}

function validateReleaseFile(file: File, platform: string): string | null {
  if (file.size === 0) return 'The selected file appears to be empty.'
  const name = file.name.toLowerCase()
  const allowed = ALLOWED_EXTENSIONS[platform] || []
  const hasValidExt = allowed.some(ext => name.endsWith(ext))
  if (!hasValidExt) {
    return `This file type is not allowed for ${platform === 'windows' ? 'Windows' : 'macOS'} releases. Allowed: ${allowed.join(', ')}`
  }
  return null
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface ReleaseForm {
  version: string
  platform: 'windows' | 'mac'
  architecture: string
  channel: 'stable' | 'beta'
  title: string
  description: string
  release_notes: string
  is_published: boolean
  is_latest: boolean
  download_url: string
}

const defaultForm = (): ReleaseForm => ({
  version: '',
  platform: 'windows',
  architecture: 'x64',
  channel: 'stable',
  title: '',
  description: '',
  release_notes: '',
  is_published: true,
  is_latest: false,
  download_url: '',
})

type UploadPhase =
  | 'idle'
  | 'selected'
  | 'creating'
  | 'uploading'
  | 'paused'
  | 'attaching'
  | 'done'
  | 'error'

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AppReleasesTab({ releases, loading, onRefresh }: AppReleasesTabProps) {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'windows' | 'mac'>('all')
  const [channelFilter, setChannelFilter] = useState<'all' | 'stable' | 'beta'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRelease, setEditingRelease] = useState<AppRelease | null>(null)
  const [isLegacyEdit, setIsLegacyEdit] = useState(false)

  const [form, setForm] = useState<ReleaseForm>(defaultForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const uploadRef = useRef<tus.Upload | null>(null)
  const contextKeyRef = useRef<string | null>(null)
  const uploadReleaseIdRef = useRef<string | null>(null)
  const uploadStoragePathRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [testingId, setTestingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredReleases = releases.filter(r => {
    if (platformFilter !== 'all' && r.platform !== platformFilter) return false
    if (channelFilter !== 'all' && r.channel !== channelFilter) return false
    return true
  })

  // ── Modal open ───────────────────────────────────────────────────────────────

  const handleOpenModal = (release?: AppRelease) => {
    setError(null)
    setFileError(null)
    setFormErrors({})
    setSelectedFile(null)
    setUploadPhase('idle')
    setUploadProgress(0)
    uploadRef.current = null
    contextKeyRef.current = null
    uploadReleaseIdRef.current = null
    uploadStoragePathRef.current = null

    if (release) {
      setEditingRelease(release)
      const legacy = !release.storage_path && !!release.download_url
      setIsLegacyEdit(legacy)
      setForm({
        version: release.version,
        platform: release.platform,
        architecture: (release as any).architecture || 'x64',
        channel: release.channel,
        title: release.title,
        description: release.description || '',
        release_notes: release.release_notes || '',
        is_published: release.is_published,
        is_latest: release.is_latest,
        download_url: release.download_url || '',
      })
    } else {
      setEditingRelease(null)
      setIsLegacyEdit(false)
      setForm(defaultForm())
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (uploadPhase === 'uploading' || uploadPhase === 'creating' || uploadPhase === 'attaching') {
      if (!confirm('An upload is in progress. Are you sure you want to cancel?')) return
      if (uploadRef.current) {
        uploadRef.current.abort()
      }
    }
    setIsModalOpen(false)
    setSelectedFile(null)
    setUploadPhase('idle')
    setError(null)
    setFileError(null)
    setFormErrors({})
  }

  // ── File selection ────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    setFileError(null)
    const err = validateReleaseFile(file, form.platform)
    if (err) {
      setFileError(err)
      return
    }
    setSelectedFile(file)
    setUploadPhase('selected')
  }, [form.platform])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleRemoveFile = () => {
    if (uploadRef.current && (uploadPhase === 'uploading' || uploadPhase === 'paused')) {
      uploadRef.current.abort()
    }
    setSelectedFile(null)
    setFileError(null)
    setUploadPhase('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePlatformChange = (platform: 'windows' | 'mac') => {
    setForm(f => ({ ...f, platform }))
    if (selectedFile) {
      const err = validateReleaseFile(selectedFile, platform)
      setFileError(err)
    }
  }

  // ── Form validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    const v = form.version.trim()

    if (!v) {
      errors.version = 'Version is required.'
    } else if (!/^\d+\.\d+\.\d+$/.test(v.replace(/^v/i, ''))) {
      errors.version = 'Use format: 1.0.0 or v1.0.0'
    }

    if (!form.title.trim()) errors.title = 'Title is required.'

    if (!editingRelease && !selectedFile) {
      errors.file = 'Please select an installer file to upload.'
    }
    if (isLegacyEdit && !form.download_url.trim()) {
      errors.download_url = 'Download URL is required for legacy releases.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Save / Upload (TUS) ────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!validate()) return

    setError(null)

    // ── EDIT: metadata-only update (no new file) ──────────────────────────────
    if (editingRelease && !selectedFile) {
      try {
        setUploadPhase('creating')
        const { error: saveError } = await supabase.rpc('admin_upsert_app_release', {
          p_id: editingRelease.id,
          p_version: form.version.trim().replace(/^v/i, ''),
          p_platform: form.platform,
          p_channel: form.channel,
          p_title: form.title.trim(),
          p_description: form.description.trim() || null,
          p_file_name: editingRelease.file_name,
          p_file_size_bytes: editingRelease.file_size_bytes,
          p_download_url: isLegacyEdit ? (form.download_url.trim() || null) : null,
          p_release_notes: form.release_notes.trim() || null,
          p_is_published: form.is_published,
          p_is_latest: form.is_latest,
          p_storage_path: editingRelease.storage_path || null,
          p_architecture: form.architecture,
        })
        if (saveError) throw saveError
        setUploadPhase('done')
        setTimeout(() => { handleCloseModal(); onRefresh() }, 600)
      } catch (err: any) {
        setError(err.message || 'Failed to save release.')
        setUploadPhase('error')
      }
      return
    }

    // ── NEW/EXISTING: TUS upload flow ────────────────────────────────────────
    if (!selectedFile) return

    const cleanVersion = form.version.trim().replace(/^v/i, '')
    const isReplacement = !!editingRelease

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) throw new Error('Not authenticated')

      const fileFingerprint = [
        selectedFile.name, 
        selectedFile.size, 
        selectedFile.lastModified,
        form.platform,
        form.channel,
        cleanVersion,
        form.architecture
      ].join('-')
      
      const contextKey = `release_upload_attempt:${userId}:${editingRelease?.id ? 'replace' : 'new'}:${editingRelease?.id || 'none'}:${fileFingerprint}`
      contextKeyRef.current = contextKey
      
      const existingContextStr = sessionStorage.getItem(contextKey)
      let contextData: { releaseId: string, uploadUuid: string, storagePath: string } | null = null

      if (existingContextStr) {
        try {
          const parsed = JSON.parse(existingContextStr)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          
          if (
            parsed &&
            typeof parsed.releaseId === 'string' && uuidRegex.test(parsed.releaseId) &&
            typeof parsed.uploadUuid === 'string' && uuidRegex.test(parsed.uploadUuid) &&
            typeof parsed.storagePath === 'string'
          ) {
            const expectedPrefix = `${form.platform}/${form.channel}/${cleanVersion}/${form.architecture}/${parsed.releaseId}/`
            const sanitizedFilename = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '-')
            const expectedObjectTail = `${parsed.uploadUuid}-${sanitizedFilename}`
            
            if (parsed.storagePath === expectedPrefix + expectedObjectTail) {
              if (isReplacement) {
                if (parsed.releaseId === editingRelease.id) {
                   contextData = parsed
                }
              } else {
                 const { data: releases, error: listErr } = await supabase.rpc('admin_list_app_releases')
                 if (!listErr && releases) {
                   const draftRelease = releases.find((r: any) => r.id === parsed.releaseId)
                   if (draftRelease && !draftRelease.is_published && !draftRelease.is_latest && draftRelease.platform === form.platform && draftRelease.channel === form.channel && draftRelease.version === cleanVersion && draftRelease.architecture === form.architecture && (!draftRelease.storage_path || draftRelease.storage_path === parsed.storagePath)) {
                      contextData = parsed
                   }
                 }
              }
            }
          }
          if (!contextData) {
            sessionStorage.removeItem(contextKey)
          }
        } catch (e) {
          sessionStorage.removeItem(contextKey)
        }
      }

      let releaseIdToUse = editingRelease?.id

      if (!isReplacement) {
        if (contextData?.releaseId) {
          releaseIdToUse = contextData.releaseId
        } else {
          // 1. Create DB Draft Record
          setUploadPhase('creating')
          const { data: releaseData, error: createError } = await supabase.rpc('admin_create_app_release_draft', {
            p_platform: form.platform,
            p_channel: form.channel,
            p_version: cleanVersion,
            p_title: form.title.trim(),
            p_architecture: form.architecture,
          })
          if (createError) throw createError
          releaseIdToUse = (releaseData as any)?.id
          if (!releaseIdToUse) throw new Error('Could not get release ID after creation.')
        }
      }

      // Generate unique path
      const uploadUuid = contextData?.uploadUuid || crypto.randomUUID()
      const storagePath = contextData?.storagePath || buildStoragePath(
        form.platform,
        form.channel,
        cleanVersion,
        form.architecture,
        releaseIdToUse!,
        uploadUuid,
        selectedFile.name
      )

      uploadReleaseIdRef.current = releaseIdToUse!
      uploadStoragePathRef.current = storagePath

      if (!contextData) {
        sessionStorage.setItem(contextKey, JSON.stringify({ releaseId: releaseIdToUse, uploadUuid, storagePath }))
      }

      // 2. Upload via TUS
      setUploadPhase('uploading')
      setUploadProgress(0)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Missing authentication token for upload')

      const uploadUrl = `${SUPABASE_URL}/storage/v1/upload/resumable`

      const upload = new tus.Upload(selectedFile, {
        endpoint: uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${token}`,
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        fingerprint: (file) => {
          return Promise.resolve(
            ['tus', releaseIdToUse, storagePath, file.name, file.size, file.lastModified].join('-')
          )
        },
        metadata: {
          bucketName: 'app-releases',
          objectName: storagePath,
          contentType: selectedFile.type || 'application/octet-stream',
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: async function (tusError) {
          setError(tusError.message || 'Upload interrupted')
          setUploadPhase('error')
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(1)
          setUploadProgress(parseFloat(percentage))
        },
        onSuccess: async function () {
          try {
            setUploadPhase('attaching')
            
            // 3. Atomically finalize everything
            const { error: finalizeError } = await supabase!.rpc('admin_finalize_app_release_upload', {
              p_release_id: releaseIdToUse,
              p_storage_path: storagePath,
              p_file_name: selectedFile.name,
              p_file_size_bytes: selectedFile.size,
              p_is_published: form.is_published,
              p_is_latest: form.is_latest,
              p_platform: form.platform,
              p_channel: form.channel,
              p_version: cleanVersion,
              p_architecture: form.architecture,
              p_title: form.title.trim(),
              p_description: form.description.trim() || null,
              p_release_notes: form.release_notes.trim() || null
            })
            
            if (finalizeError) {
              const { error: cleanupError } = await supabase!.storage.from('app-releases').remove([storagePath])
              if (cleanupError) {
                console.error("Cleanup failed:", cleanupError)
                alert(`Upload failed, but we couldn't delete the temporary file. Please manually delete: ${storagePath}. Storage Error: ${cleanupError.message}`)
              }
              throw finalizeError
            }

            // 4. Cleanup old storage path if this was a replacement
            if (isReplacement && editingRelease.storage_path && editingRelease.storage_path !== storagePath) {
              const { error: removeOldError } = await supabase!.storage.from('app-releases').remove([editingRelease.storage_path])
              if (removeOldError) {
                 console.warn("Failed to remove old installer file:", removeOldError)
                 alert(`Release successfully replaced, but we failed to delete the old installer file: ${removeOldError.message}`)
              }
            }

            setUploadProgress(100)
            setUploadPhase('done')
            
            // Clean up persistent context
            if (contextKeyRef.current) {
              sessionStorage.removeItem(contextKeyRef.current)
              contextKeyRef.current = null
            }
            
            setTimeout(() => { handleCloseModal(); onRefresh() }, 1200)

          } catch (err: any) {
            setError(err.message || 'Failed to finalize upload.')
            setUploadPhase('error')
          }
        }
      })

      uploadRef.current = upload
      
      const previousUploads = await upload.findPreviousUploads()
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      
      upload.start()

    } catch (err: any) {
      setError(err.message || 'Failed to start upload.')
      setUploadPhase('error')
    }
  }

  // ── TUS Controls ───────────────────────────────────────────────────────────────

  const togglePauseUpload = () => {
    if (!uploadRef.current) return
    if (uploadPhase === 'uploading') {
      uploadRef.current.abort()
      setUploadPhase('paused')
    } else if (uploadPhase === 'paused') {
      uploadRef.current.start()
      setUploadPhase('uploading')
    }
  }

  const cancelUpload = async () => {
    if (!uploadRef.current) return
    const isDraft = !editingRelease
    if (confirm(isDraft ? 'Cancel upload and discard file?' : 'Cancel replacement upload? (Existing release will be preserved)')) {
      uploadRef.current.abort()
      
      const currentContextKey = contextKeyRef.current
      
      if (isDraft && uploadReleaseIdRef.current) {
        if (uploadStoragePathRef.current) {
           const { error: storageErr } = await supabase!.storage.from('app-releases').remove([uploadStoragePathRef.current])
           if (storageErr) {
             console.error("Cleanup error", storageErr)
             alert(`Warning: Failed to cleanup temporary storage file: ${storageErr.message}. Recovery information preserved. Please try discarding again later.`)
             return
           }
        }
        const { error: dbErr } = await supabase!.rpc('admin_delete_app_release', { p_release_id: uploadReleaseIdRef.current })
        if (dbErr) {
          console.error("Cleanup error", dbErr)
          alert(`Warning: Failed to delete draft release: ${dbErr.message}. Recovery information preserved.`)
          return
        }
        onRefresh()
      }

      if (currentContextKey) {
        sessionStorage.removeItem(currentContextKey)
        contextKeyRef.current = null
      }

      setUploadPhase('idle')
      setSelectedFile(null)
    }
  }

  // ── Set Latest ─────────────────────────────────────────────────────────────────

  const handleSetLatest = async (id: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.rpc('admin_set_latest_app_release', { p_release_id: id })
      if (error) throw error
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to set latest')
    }
  }

  // ── Publish / Unpublish toggle ─────────────────────────────────────────────────

  const handleTogglePublish = async (release: AppRelease) => {
    if (!supabase) return
    try {
      const { error } = await supabase.rpc('admin_upsert_app_release', {
        p_id: release.id,
        p_version: release.version,
        p_platform: release.platform,
        p_channel: release.channel,
        p_title: release.title,
        p_description: release.description || null,
        p_file_name: release.file_name || null,
        p_file_size_bytes: release.file_size_bytes || null,
        p_download_url: release.download_url || null,
        p_release_notes: release.release_notes || null,
        p_is_published: !release.is_published,
        p_is_latest: release.is_published ? false : release.is_latest,
        p_storage_path: release.storage_path || null,
        p_architecture: (release as any).architecture || 'x64',
      })
      if (error) throw error
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to update')
    }
  }

  // ── Test Download (via Edge Function) ──────────────────────────────────────────

  const handleTestDownload = async (release: AppRelease) => {
    if (!supabase) return
    
    // 1. Open blank window synchronously during original click to bypass popup blockers
    const popup = window.open('about:blank', '_blank')
    
    // 2. If blocked, stop before async work
    if (!popup) {
      alert('Allow pop-ups for Test Download')
      return
    }
    
    setTestingId(release.id)
    
    // 4. Safely sever opener access
    popup.opener = null
    
    // 5. Show temporary waiting message
    popup.document.write('Waiting for download URL...')
    
    try {
      // 6. Await network request
      const { data, error } = await supabase.functions.invoke('get-release-download', {
        body: { release_id: release.id }
      })
      if (error) throw error
      
      const url = data?.url
      if (!url) throw new Error(data?.error || 'No download URL returned.')
      
      // 7. On success, navigate existing handle
      popup.location.href = url
    } catch (err: any) {
      // 8. On failure, close existing handle
      popup.close()
      const errMsg = err?.context?.json?.error || err.message || 'Test download failed'
      alert(`Download Error: ${errMsg}`)
    } finally {
      setTestingId(null)
    }
  }

  // ── Delete (Consistent flow) ───────────────────────────────────────────────────

  const handleDelete = async (release: AppRelease) => {
    if (!supabase) return
    const warning = release.is_latest
      ? `WARNING: "${release.title}" is currently the latest release.\n\nDeleting it will remove the download from the public page.\n\nContinue?`
      : release.is_published
        ? `"${release.title}" is published. Deleting it will remove it from the public download page.\n\nContinue?`
        : `Delete draft release "${release.title}"?`

    if (!confirm(warning)) return

    setDeletingId(release.id)
    try {
      if (release.is_published || release.is_latest) {
        const { error: unpubError } = await supabase.rpc('admin_upsert_app_release', {
          p_id: release.id,
          p_version: release.version,
          p_platform: release.platform,
          p_channel: release.channel,
          p_title: release.title,
          p_description: release.description || null,
          p_file_name: release.file_name || null,
          p_file_size_bytes: release.file_size_bytes || null,
          p_download_url: release.download_url || null,
          p_release_notes: release.release_notes || null,
          p_is_published: false,
          p_is_latest: false,
          p_storage_path: release.storage_path || null,
          p_architecture: (release as any).architecture || 'x64',
        })
        if (unpubError) throw unpubError
      }

      if (release.storage_path) {
        const { error: storageError } = await supabase!.storage.from('app-releases').remove([release.storage_path])
        if (storageError) {
          throw new Error(`Failed to delete storage file: ${storageError.message}. The release is now unpublished but the file remains.`)
        }
      }
      
      const { error: dbError } = await supabase!.rpc('admin_delete_app_release', { p_release_id: release.id })
      if (dbError) throw dbError
      
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2.5 rounded-lg text-sm transition-colors bg-slate-100 border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
      hasError
        ? 'border-red-400 focus:border-red-500'
        : 'border-slate-200 focus:border-indigo-500'
    } text-slate-900 placeholder:text-slate-500`

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
          >
            <option value="all">All Platforms</option>
            <option value="windows">Windows</option>
            <option value="mac">macOS</option>
          </select>
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
          >
            <option value="all">All Channels</option>
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-slate-900 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
        >
          <Plus size={16} /> Add Release
        </button>
      </div>

      <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Version</th>
                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Platform</th>
                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">File</th>
                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-3">
                      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredReleases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-sm">
                    No releases found.
                  </td>
                </tr>
              ) : (
                filteredReleases.map(release => {
                  const isLegacy = !release.storage_path && !!release.download_url
                  return (
                    <tr key={release.id} className="hover:bg-slate-100 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">v{release.version}</span>
                          {release.is_latest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                              <Star size={9} className="fill-current" /> Latest
                            </span>
                          )}
                          {isLegacy && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                              <Link2 size={9} /> External URL
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{release.title}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{formatDate(release.created_at)}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          {release.platform === 'windows' ? <Monitor size={15} /> : <Apple size={15} />}
                          <div>
                            <p className="font-medium capitalize">{release.platform === 'mac' ? 'macOS' : 'Windows'}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {release.channel} · {(release as any).architecture || 'x64'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {release.file_name ? (
                          <div>
                            <p className="text-slate-700 text-xs font-mono truncate max-w-[180px]" title={release.file_name}>{release.file_name}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{formatBytes(release.file_size_bytes)}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {release.is_published ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <CheckCircle2 size={14} /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                            <AlertCircle size={14} /> Draft
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {!release.is_latest && release.is_published && (
                            <button
                              onClick={() => handleSetLatest(release.id)}
                              className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Mark as Latest"
                            >
                              <Star size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePublish(release)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title={release.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {release.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={() => handleTestDownload(release)}
                            disabled={testingId === release.id}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Test Download"
                          >
                            {testingId === release.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                          </button>
                          <button
                            onClick={() => handleOpenModal(release)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit metadata"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(release)}
                            disabled={deletingId === release.id}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete release"
                          >
                            {deletingId === release.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-gray-900/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) handleCloseModal() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[88vh] flex flex-col border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingRelease ? 'Edit Release' : 'Add App Release'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingRelease ? 'Update release metadata' : 'Upload an installer securely (supports resumable uploads)'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  disabled={uploadPhase === 'uploading' || uploadPhase === 'creating' || uploadPhase === 'attaching'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {error && (
                  <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-2.5">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">Action failed</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                <form id="releaseForm" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Version <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.version}
                        onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                        placeholder="1.0.0"
                        className={inputCls(!!formErrors.version)}
                      />
                      {formErrors.version && <p className="mt-1 text-xs text-red-500">{formErrors.version}</p>}
                      <p className="text-xs text-slate-500 mt-1">e.g. 1.0.0 or v1.0.0</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="SyncFrame Studio v1.0.0"
                        className={inputCls(!!formErrors.title)}
                      />
                      {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Platform</label>
                      <select
                        value={form.platform}
                        onChange={e => handlePlatformChange(e.target.value as any)}
                        disabled={!!editingRelease}
                        className={`${inputCls()} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="windows">Windows</option>
                        <option value="mac">macOS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Architecture</label>
                      <select
                        value={form.architecture}
                        onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))}
                        className={inputCls()}
                      >
                        <option value="x64">x64</option>
                        <option value="arm64">arm64</option>
                        <option value="universal">Universal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Channel</label>
                      <select
                        value={form.channel}
                        onChange={e => setForm(f => ({ ...f, channel: e.target.value as any }))}
                        className={inputCls()}
                      >
                        <option value="stable">Stable</option>
                        <option value="beta">Beta</option>
                      </select>
                    </div>
                  </div>

                  {!editingRelease && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Installer File <span className="text-red-500">*</span>
                      </label>

                      {selectedFile ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <HardDrive size={18} className="text-indigo-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900 truncate">{selectedFile.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {formatBytes(selectedFile.size)} · {form.platform === 'windows' ? 'Windows' : 'macOS'}
                              </p>
                            </div>
                            
                            {(uploadPhase === 'uploading' || uploadPhase === 'paused') && (
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={togglePauseUpload} className="p-1.5 text-slate-500 hover:text-indigo-500 rounded bg-slate-100 border border-slate-200">
                                  {uploadPhase === 'uploading' ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                                <button type="button" onClick={cancelUpload} className="p-1.5 text-slate-500 hover:text-red-500 rounded bg-slate-100 border border-slate-200">
                                  <XCircle size={14} />
                                </button>
                              </div>
                            )}

                            {(uploadPhase === 'idle' || uploadPhase === 'selected' || uploadPhase === 'error') && (
                              <button type="button" onClick={handleRemoveFile} className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors">
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          {(uploadPhase === 'uploading' || uploadPhase === 'paused' || uploadPhase === 'creating' || uploadPhase === 'attaching') && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                  {uploadPhase === 'uploading' ? <Loader2 size={12} className="animate-spin text-indigo-500" /> : null}
                                  {uploadPhase === 'creating' ? 'Preparing database record…' :
                                   uploadPhase === 'uploading' ? `Uploading...` :
                                   uploadPhase === 'paused' ? `Upload paused` :
                                   'Finalizing attachment…'}
                                </span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${uploadPhase === 'paused' ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  transition={{ duration: 0.2 }}
                                />
                              </div>
                            </div>
                          )}

                          {uploadPhase === 'done' && (
                            <div className="mt-3 flex items-center gap-2 text-green-400 text-sm font-medium">
                              <CheckCircle2 size={16} /> Upload complete!
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                            isDragging
                              ? 'border-indigo-400 bg-indigo-500/10'
                              : 'border-white/15 hover:border-indigo-500/50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Upload size={22} className="text-slate-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-700">
                              Drag & drop or click to choose
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {form.platform === 'windows' ? 'Windows: .exe, .msi, .zip' : 'macOS: .dmg, .pkg, .zip'}
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={form.platform === 'windows' ? '.exe,.msi,.zip' : '.dmg,.pkg,.zip'}
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) handleFileSelect(f)
                            }}
                          />
                        </div>
                      )}

                      {fileError && <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={12} />{fileError}</p>}
                      {formErrors.file && <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={12} />{formErrors.file}</p>}
                    </div>
                  )}

                  {editingRelease && (
                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current File</p>
                      {editingRelease.storage_path ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <HardDrive size={14} className="text-indigo-500 flex-shrink-0" />
                          <span className="font-mono text-xs truncate">{editingRelease.file_name || editingRelease.storage_path}</span>
                          <span className="text-slate-500">· {formatBytes(editingRelease.file_size_bytes)}</span>
                        </div>
                      ) : editingRelease.download_url ? (
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                          <Link2 size={14} className="flex-shrink-0" />
                          <span className="font-mono text-xs truncate">{editingRelease.download_url}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No file attached.</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        To replace the file, delete this release and create a new one.
                      </p>
                    </div>
                  )}

                  {isLegacyEdit && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">External Download URL</label>
                      <input
                        type="url"
                        value={form.download_url}
                        onChange={e => setForm(f => ({ ...f, download_url: e.target.value }))}
                        placeholder="https://..."
                        className={inputCls(!!formErrors.download_url)}
                      />
                      {formErrors.download_url && <p className="mt-1 text-xs text-red-500">{formErrors.download_url}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Description <span className="text-slate-500 font-normal normal-case">(optional)</span>
                    </label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls()} resize-none`} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Release Notes <span className="text-slate-500 font-normal normal-case">(optional)</span>
                    </label>
                    <textarea rows={3} value={form.release_notes} onChange={e => setForm(f => ({ ...f, release_notes: e.target.value }))} className={`${inputCls()} resize-none font-mono text-xs`} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Published</p>
                        <p className="text-xs text-slate-500">Visible to users</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={form.is_latest} onChange={e => setForm(f => ({ ...f, is_latest: e.target.checked }))} className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Mark as Latest</p>
                        <p className="text-xs text-slate-500">Default download for this platform</p>
                      </div>
                    </label>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-100 flex items-center justify-end gap-3 flex-shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={uploadPhase === 'uploading' || uploadPhase === 'creating' || uploadPhase === 'attaching'}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  form="releaseForm"
                  type="submit"
                  disabled={uploadPhase === 'uploading' || uploadPhase === 'creating' || uploadPhase === 'attaching' || uploadPhase === 'done' || !!fileError || uploadPhase === 'paused'}
                  className="px-6 py-2.5 bg-indigo-600 text-slate-900 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {(uploadPhase === 'creating' || uploadPhase === 'uploading' || uploadPhase === 'attaching' || uploadPhase === 'paused') ? (
                    <><Loader2 size={15} className={`animate-spin ${uploadPhase === 'paused' ? 'invisible' : ''}`} /> Uploading…</>
                  ) : uploadPhase === 'done' ? (
                    <><CheckCircle2 size={15} /> Done!</>
                  ) : editingRelease ? (
                    'Save Changes'
                  ) : (
                    <><Upload size={15} /> Upload Release</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
