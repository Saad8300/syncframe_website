// src/lib/plans.ts
// Plan constants matching the desktop app exactly.
// Free < Starter < Pro < Agency

export interface Plan {
  id: string
  display_name: string
  price_pkr: number | null     // null = free
  price_label: string
  monthly_credits: number
  credits_note: string
  features: string[]
  highlighted?: boolean
  badge?: string
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    display_name: 'Free Trial',
    price_pkr: null,
    price_label: 'Free',
    monthly_credits: 30,
    credits_note: '30 one-time credits, no monthly renewal',
    features: [
      '30 one-time trial credits',
      '720p export quality',
      'Watermark on exports',
      'Basic timeline tools',
      'Script Timestamp access',
      'Local rendering',
      'Good for testing SyncFrame',
    ],
  },
  {
    id: 'starter',
    display_name: 'Starter',
    price_pkr: 499,
    price_label: 'Rs 499',
    monthly_credits: 1500,
    credits_note: '1,500 credits / month',
    features: [
      '1,500 monthly credits',
      '1080p export quality',
      'No watermark',
      'Image Timeline tool',
      'Script Timestamp tool',
      'History & saved exports',
      'Local rendering',
      'Email support',
    ],
  },
  {
    id: 'pro',
    display_name: 'Pro',
    price_pkr: 1499,
    price_label: 'Rs 1,499',
    monthly_credits: 6000,
    credits_note: '6,000 credits / month',
    features: [
      '6,000 monthly credits',
      '2K export quality',
      'No watermark',
      'Batch Video Generator',
      'Video & Media Timeline',
      'Premium templates',
      'Advanced workflow controls',
      'Priority workflow features',
    ],
    highlighted: false,
  },
  {
    id: 'agency',
    display_name: 'Agency',
    price_pkr: 2999,
    price_label: 'Rs 2,999',
    monthly_credits: 10000,
    credits_note: '10,000 credits / month',
    features: [
      '10,000 monthly credits',
      '4K export quality',
      'No watermark',
      'All tools unlocked',
      'Large batch generation',
      'Commercial usage rights',
      'Advanced workflow controls',
      'High-volume production',
      'Agency & team usage',
    ],
    highlighted: true,
    badge: 'Best Value',
  },
]

export const PLAN_AMOUNT_PKR: Record<string, number> = {
  starter: 499,
  pro: 1499,
  agency: 2999,
}

export const PLAN_CREDITS: Record<string, number> = {
  free: 30,
  starter: 1500,
  pro: 6000,
  agency: 10000,
}

export function getPlanById(id: string): Plan {
  return PLANS.find(p => p.id === id) ?? PLANS[0]
}

/**
 * Maps legacy database plan IDs to current plan IDs.
 * These aliases exist because some older Supabase rows may still contain
 * the old names ('standard', 'ultra', 'premium'). This function normalizes
 * them internally.
 *
 * IMPORTANT: These old names must NEVER be shown in the UI.
 * Always use plan.display_name from the PLANS array for user-facing text.
 */
export function normalizePlanId(planId: string): string {
  const n = planId.toLowerCase().trim()
  // Legacy DB aliases — internal only, never display these to users
  if (n === 'standard') return 'starter'
  if (n === 'premium') return 'pro'
  if (n === 'ultra' || n === 'enterprise') return 'agency'
  return n
}

export function formatToolName(toolName: string): string {
  const map: Record<string, string> = {
    image_timeline: 'Image Timeline',
    video_timeline: 'Video Timeline',
    media_timeline: 'Media Timeline',
    audio_merger: 'Audio Merger',
    script_timestamp: 'Script Timestamp',
    batch_video_generator: 'Batch Video Generator',
    batch_video: 'Batch Video Generator',
    video_export: 'Video Export',
  }
  return map[toolName] ?? toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
