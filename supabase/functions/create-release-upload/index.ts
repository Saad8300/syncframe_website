import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { CreateMultipartUploadCommand } from "npm:@aws-sdk/client-s3"
import { corsHeaders } from "../_shared/cors.ts"
import { requireAdmin } from "../_shared/auth.ts"
import { getS3Client, getR2BucketName } from "../_shared/s3.ts"

function respondError(step: string, error: string, details: any = null) {
  // Return 200 so supabase-js client can read the structured JSON instead of a generic 400 error.
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
    await requireAdmin(req)

    step = 'parse_json'
    const body = await req.json()
    const { platform, channel, version, architecture, file_name, release_id } = body

    step = 'validate_inputs'
    if (!platform || !channel || !version || !architecture || !file_name || !release_id) {
      throw new Error(`Missing required fields. Received: ${JSON.stringify(body)}`)
    }

    step = 'sanitize_metadata'
    const cleanVersion = version.replace(/^v/i, '').replace(/\s+/g, '-')
    const safeArch = architecture.replace(/\s+/g, '-')
    const safeFileName = file_name.replace(/[^a-zA-Z0-9.\-_]/g, '-')
    const uploadUuid = crypto.randomUUID()
    
    // Prefix with r2-releases to easily distinguish from Supabase storage
    const objectKey = `r2-releases/${platform}/${channel}/${cleanVersion}/${safeArch}/${release_id}/${uploadUuid}-${safeFileName}`

    step = 'init_s3_client'
    const s3 = getS3Client()
    const command = new CreateMultipartUploadCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
      ContentType: 'application/octet-stream'
    })

    step = 'send_s3_command'
    const result = await s3.send(command)

    if (!result.UploadId) {
      throw new Error('S3 returned success but UploadId was empty')
    }

    return new Response(JSON.stringify({ 
      success: true,
      objectKey, 
      uploadId: result.UploadId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return respondError(step, error.message, error)
  }
})
