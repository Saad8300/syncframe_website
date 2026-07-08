// Shared admin types

export interface PaymentRequest {
  id: string
  user_id: string
  email: string
  full_name: string
  requested_plan: string
  amount_pkr: number
  base_amount_pkr?: number
  discount_amount_pkr?: number
  final_amount_pkr?: number
  coupon_code?: string
  payment_method: string
  payment_account_id?: string
  transaction_reference: string
  notes: string | null
  phone_number?: string | null
  contact_email?: string | null
  idempotency_key?: string | null
  payment_proof_path?: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export interface Member {
  user_id: string
  email: string
  full_name: string | null
  phone_number: string | null
  created_at: string
  plan_id: string
  subscription_status: string
  current_period_start: string
  current_period_end: string
  balance: number
  monthly_allocation: number
  lifetime_used: number
  next_reset_at: string
  recent_usage_count: number
  last_usage_at: string
}

export interface Plan {
  id: string
  display_name: string
  price_pkr: number
  price_label: string
  monthly_credits: number
  short_description: string
  is_popular: boolean
  public_visible: boolean
  sort_order?: number
}

export interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  applies_to_plan: string | null
  active: boolean
  expires_at: string | null
  max_redemptions: number | null
  redemption_count: number
  created_at: string
}

export interface PaymentAccount {
  id: string
  method: string
  account_title: string
  account_number: string
  bank_name: string | null
  iban: string | null
  instructions: string | null
  active: boolean
  sort_order: number
}

export interface AppRelease {
  id: string
  version: string
  platform: 'windows' | 'mac'
  channel: 'stable' | 'beta'
  architecture: string
  title: string
  description: string | null
  file_name: string | null
  file_size_bytes: number | null
  download_url: string | null   // nullable — only set for legacy external URL releases
  storage_path: string | null   // set for new managed storage releases
  checksum_sha256: string | null
  is_latest: boolean
  is_published: boolean
  release_notes: string | null
  created_at: string
  updated_at: string
}

export interface ChangelogEntry {
  id: string
  version: string
  title: string
  summary: string | null
  content: string
  category: 'release' | 'feature' | 'fix' | 'security' | 'improvement'
  tags: string[]
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}
