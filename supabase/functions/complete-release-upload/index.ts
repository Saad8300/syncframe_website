import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { CompleteMultipartUploadCommand, HeadObjectCommand } from "npm:@aws-sdk/client-s3"
import { corsHeaders } from "../_shared/cors.ts"
import { requireAdmin } from "../_shared/auth.ts"
import { getS3Client, getR2BucketName } from "../_shared/s3.ts"

function respondError(step: string, error: string, details: any = null) {
  return new Response(JSON.stringify({ success: false, step, error, details }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let step = 'init'
  try {
    if (req.method !== 'POST') throw new Error('Method not allowed')
    
    step = 'auth'
    const { supabaseAdmin } = await requireAdmin(req)

    step = 'parse_json'
    const { 
      objectKey, 
      uploadId, 
      parts,
      release_id,
      file_name,
      platform,
      channel,
      version,
      architecture,
      title,
      description,
      release_notes,
      is_published,
      is_latest
    } = await req.json()

    step = 'validate_inputs'
    if (!objectKey || !uploadId || !parts || !release_id || !file_name || !platform || !channel || !version || !architecture || !title) {
      throw new Error('Missing required fields')
    }

    step = 'init_s3_client'
    const s3 = getS3Client()
    const bucket = getR2BucketName()

    step = 'complete_multipart'
    const completeCmd = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p: any) => ({
          ETag: p.ETag,
          PartNumber: p.PartNumber
        }))
      }
    })
    await s3.send(completeCmd)

    step = 'head_object'
    const headCmd = new HeadObjectCommand({ Bucket: bucket, Key: objectKey })
    const headRes = await s3.send(headCmd)
    const fileSizeBytes = headRes.ContentLength || 0

    if (fileSizeBytes <= 0) {
      throw new Error('Completed upload resulted in 0 byte file')
    }

    step = 'finalize_db'
    const { data: releaseData, error: finalizeError } = await supabaseAdmin.rpc('admin_finalize_app_release_upload', {
      p_release_id: release_id,
      p_storage_path: objectKey,
      p_file_name: file_name,
      p_file_size_bytes: fileSizeBytes,
      p_is_published: is_published || false,
      p_is_latest: is_latest || false,
      p_platform: platform,
      p_channel: channel,
      p_version: version,
      p_architecture: architecture,
      p_title: title,
      p_description: description || null,
      p_release_notes: release_notes || null
    })

    if (finalizeError) throw new Error(`Database error: ${finalizeError.message}`)

    return new Response(JSON.stringify({ success: true, release: releaseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return respondError(step, error.message, error)
  }
})
