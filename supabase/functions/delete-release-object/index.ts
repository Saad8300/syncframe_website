import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { DeleteObjectCommand } from "npm:@aws-sdk/client-s3"
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
    const { objectKey } = await req.json()

    step = 'validate_inputs'
    if (!objectKey) throw new Error('Missing objectKey')

    step = 'delete_object'
    if (objectKey.startsWith('r2-releases/')) {
      const s3 = getS3Client()
      const command = new DeleteObjectCommand({
        Bucket: getR2BucketName(),
        Key: objectKey
      })
      await s3.send(command)
    } else {
       throw new Error('Not an R2 object key')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return respondError(step, error.message, error)
  }
})
