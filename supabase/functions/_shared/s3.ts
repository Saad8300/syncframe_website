import { S3Client } from "npm:@aws-sdk/client-s3"

export function getS3Client() {
  return new S3Client({
    region: Deno.env.get('R2_REGION') || 'auto',
    endpoint: Deno.env.get('R2_ENDPOINT') || '',
    forcePathStyle: true,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') || '',
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') || '',
    },
  })
}

export function getR2BucketName() {
  return Deno.env.get('R2_BUCKET_NAME') || ''
}
