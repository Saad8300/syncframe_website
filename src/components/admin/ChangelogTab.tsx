import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Tag as TagIcon } from 'lucide-react'
import type { ChangelogEntry } from './adminTypes'
import { supabase } from '../../lib/supabaseClient'

interface ChangelogTabProps {
  changelogs: ChangelogEntry[]
  loading: boolean
  onRefresh: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  release: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  feature: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fix: 'bg-amber-50 text-amber-700 border-amber-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  improvement: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function ChangelogTab({ changelogs, loading, onRefresh }: ChangelogTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<ChangelogEntry | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    version: '',
    title: '',
    summary: '',
    content: '',
    category: 'release' as ChangelogEntry['category'],
    tags: '',
    published: true,
  })

  const handleOpenModal = (log?: ChangelogEntry) => {
    if (log) {
      setEditingLog(log)
      setForm({
        version: log.version,
        title: log.title,
        summary: log.summary || '',
        content: log.content,
        category: log.category,
        tags: log.tags.join(', '),
        published: log.published,
      })
    } else {
      setEditingLog(null)
      setForm({
        version: '',
        title: '',
        summary: '',
        content: '',
        category: 'release',
        tags: '',
        published: true,
      })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    setSaving(true)
    setError(null)

    try {
      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      const { error: saveError } = await supabase.rpc('admin_upsert_changelog_entry', {
        p_id: editingLog?.id ?? null,
        p_version: form.version,
        p_title: form.title,
        p_summary: form.summary || null,
        p_content: form.content,
        p_category: form.category,
        p_tags: tagsArray,
        p_published: form.published
      })

      if (saveError) throw saveError
      setIsModalOpen(false)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save changelog entry')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm('Are you sure you want to delete this changelog entry?')) return
    try {
      const { error } = await supabase.rpc('admin_delete_changelog_entry', { p_entry_id: id })
      if (error) throw error
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-slate-900 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Changelog
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-none border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Version</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Published Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading changelogs...</td></tr>
              ) : changelogs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No changelog entries found.</td></tr>
              ) : (
                changelogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-100 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{log.version}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{log.title}</div>
                      {log.summary && <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">{log.summary}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${CATEGORY_COLORS[log.category] || CATEGORY_COLORS.release}`}>
                        <span className="capitalize">{log.category}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.published ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 text-sm font-medium">
                          <CheckCircle2 size={16} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                          <AlertCircle size={16} /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {log.published_at ? new Date(log.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(log)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingLog ? 'Edit Changelog' : 'Add Changelog Entry'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500 p-1">
                <AlertCircle size={20} className="opacity-0 hidden" /> {/* spacer */}
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-start gap-3">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <form id="changelogForm" onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Version *</label>
                    <input required type="text" value={form.version} onChange={e => setForm({...form, version: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:bg-white text-slate-900 transition-colors" placeholder="e.g. v1.0.0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:bg-white text-slate-900 transition-colors">
                      <option value="release">Major Release</option>
                      <option value="feature">New Feature</option>
                      <option value="improvement">Improvement</option>
                      <option value="fix">Bug Fix</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:bg-white text-slate-900 transition-colors" placeholder="What's new in this update?" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Summary (optional)</label>
                  <input type="text" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:bg-white text-slate-900 transition-colors" placeholder="Brief 1-sentence summary" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content (Markdown supported) *</label>
                  <textarea required rows={8} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:bg-white text-slate-900 transition-colors font-mono" placeholder="Detailed release notes..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <TagIcon size={14} /> Tags
                  </label>
                  <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:bg-white text-slate-900 transition-colors" placeholder="ui, performance, mac (comma separated)" />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-slate-800">Published (visible on Changelog page)</span>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                form="changelogForm"
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-slate-900 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changelog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
