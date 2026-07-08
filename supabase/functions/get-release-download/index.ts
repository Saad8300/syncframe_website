import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { GetObjectCommand } from "npm:@aws-sdk/client-s3"
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner"
import { getS3Client, getR2BucketName } from "../_shared/s3.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      headers: { ...corsHeaders, 'Allow': 'POST, OPTIONS' },
      status: 405
    })
  }

  try {
    const { release_id } = await req.json()
    if (!release_id) {
      throw new Error('release_id is required')
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(release_id)) {
      throw new Error('Invalid release_id format')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Service unavailable')
    }

    // Initialize Supabase with service role key to securely fetch the release and generate signed URLs
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: release, error: releaseError } = await supabaseAdmin
      .from('app_releases')
      .select('id, is_published, storage_path, file_name, version, platform, architecture, download_url')
      .eq('id', release_id)
      .single()

    if (releaseError || !release) {
      return new Response(
        JSON.stringify({ error: 'Release not found or not available for download' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 404 }
      )
    }

    // If release is NOT published, verify the caller is an Admin
    if (!release.is_published) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Test download requires admin authentication.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 401 }
        )
      }

      const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: authHeader } },
      })

      const jwt = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(jwt);
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Invalid authentication token.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 401 }
        )
      }

      const { data: adminCheck, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminCheck) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Admin privileges required.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 401 }
        )
      }
    }

    // Case 1: Managed storage release
    if (release.storage_path) {
      if (release.storage_path.startsWith('r2-releases/')) {
        try {
          const s3 = getS3Client()
          const command = new GetObjectCommand({
            Bucket: getR2BucketName(),
            Key: release.storage_path
          })
          const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 })

          return new Response(
            JSON.stringify({
              url: signedUrl,
              file_name: release.file_name,
              version: release.version,
              platform: release.platform,
              architecture: release.architecture,
              source: 'r2-storage'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
          )
        } catch (r2Error) {
          return new Response(
            JSON.stringify({ error: 'Download temporarily unavailable (R2)' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 500 }
          )
        }
      } else {
        const { data: signedData, error: signedError } = await supabaseAdmin
          .storage
          .from('app-releases')
          .createSignedUrl(release.storage_path, 900) // 15 minutes

        if (signedError || !signedData?.signedUrl) {
          return new Response(
            JSON.stringify({ error: 'Download temporarily unavailable' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 500 }
          )
        }

        return new Response(
          JSON.stringify({
            url: signedData.signedUrl,
            file_name: release.file_name,
            version: release.version,
            platform: release.platform,
            architecture: release.architecture,
            source: 'storage'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
        )
      }
    }

    // Case 2: Legacy external URL release
    if (release.download_url) {
      return new Response(
        JSON.stringify({
          url: release.download_url,
          file_name: release.file_name,
          version: release.version,
          platform: release.platform,
          architecture: release.architecture,
          source: 'legacy'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'No download file available for this release' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 404 }
    )

  } catch (error: any) {
    const isSafeError = error.message === 'release_id is required' || error.message === 'Invalid release_id format'
    return new Response(
      JSON.stringify({ error: isSafeError ? error.message : 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, status: 400 }
    )
  }
})
