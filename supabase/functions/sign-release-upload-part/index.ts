import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { UploadPartCommand } from "npm:@aws-sdk/client-s3"
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner"
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
    await requireAdmin(req)

    step = 'parse_json'
    const { objectKey, uploadId, partNumber } = await req.json()

    step = 'validate_inputs'
    if (!objectKey || !uploadId || !partNumber) {
      throw new Error('Missing required fields')
    }

    step = 'init_s3_client'
    const s3 = getS3Client()
    const command = new UploadPartCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber
    })

    step = 'sign_url'
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 }) // 15 mins

    return new Response(JSON.stringify({ success: true, signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return respondError(step, error.message, error)
  }
})
