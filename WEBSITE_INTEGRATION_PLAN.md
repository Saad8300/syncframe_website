# WEBSITE_INTEGRATION_PLAN.md

# SyncFrame Studio — Website Integration Plan

This document outlines the full integration flow between the SyncFrame Studio website and the desktop application.

---

## Overview

SyncFrame Studio consists of two separate systems:

| System | Responsibility |
|--------|----------------|
| **Website** (`syncframe-website`) | Marketing, pricing, download, login, account management, payment flow |
| **Desktop App** (`syncframe-desktop-lab`) | Local rendering, timeline tools, batch generation, credit usage, plan checks |

---

## User Flow

```
1. User visits SyncFrame website
        ↓
2. User downloads the desktop app from the Download page
        ↓
3. User creates an account or logs in (website — /login)
        ↓
4. User selects and requests a plan upgrade (/upgrade)
        ↓
5. User pays via JazzCash / EasyPaisa / bank transfer
        and submits transaction reference
        ↓
6. Admin reviews and approves the payment request (/admin)
        ↓
7. Admin activates plan in Supabase (subscription + credit_balances)
        ↓
8. User opens the SyncFrame Studio desktop app
        ↓
9. User logs in with the same email
        ↓
10. Desktop app reads plan and credits from Supabase
        ↓
11. Tools unlock automatically based on plan tier
        ↓
12. User creates videos and consumes credits
```

---

## Current Plan Tiers

| Plan | Price | Credits | Notes |
|------|-------|---------|-------|
| Free Trial | Free | 30 one-time | No monthly renewal |
| Starter | Rs 499/month | 1,500/month | Basic creator tools |
| Pro | Rs 1,499/month | 6,000/month | Batch generator, advanced tools |
| Agency | Rs 2,999/month | 10,000/month | All tools, commercial use |

Plan hierarchy: `free < starter < pro < agency`

> **Important:** Do NOT use old plan names Standard, Ultra, or n8n anywhere in the UI.
> The `normalizePlanId()` function in `src/lib/plans.ts` maps legacy database values
> (standard → starter, ultra → agency) but these must never be shown to users.

---

## Component Responsibilities

### Website (this repo)
- Public marketing pages (Home, Features, Pricing, Changelog)
- User authentication (email/password via Supabase)
- Account dashboard (plan status, credits, subscription, usage history)
- Manual payment request flow (JazzCash, EasyPaisa, bank transfer)
- Admin panel (view requests, approve/reject, plan activation SQL)

### Desktop App
- Reads auth session token from local storage / keychain
- Calls Supabase to fetch user profile, plan, and credits
- Unlocks tools based on plan tier
- Decrements credits on export
- Shows credit balance and plan info in app sidebar

---

## Technology Stack

### Website
- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Routing:** React Router v7
- **Authentication:** Supabase Auth (email + password)
- **Database:** Supabase (PostgreSQL) — same project as desktop app
- **Deployment:** Vercel (recommended)

### Desktop App
- Electron
- Supabase JS client for auth and data reads
- Local rendering engine (no cloud uploads)

---

## Supabase Schema (Active)

### Table: `subscriptions`
```sql
-- user_id, plan_id ('free'|'starter'|'pro'|'agency'), status, current_period_start, current_period_end
```

### Table: `credit_balances`
```sql
-- user_id, balance, monthly_allocation, lifetime_used, next_reset_at
```

### Table: `plans`
```sql
-- id, display_name, monthly_credits, limits_json, features, price_placeholder
```

### Table: `usage_jobs`
```sql
-- user_id, tool_name, credits_used, cost, status, created_at
```

### Table: `payment_requests` (NEW — created by migration 001)
```sql
-- id, user_id, email, full_name, requested_plan, amount_pkr,
-- payment_method, transaction_reference, notes, status, created_at, reviewed_by, reviewed_at
```

### Table: `admin_users` (NEW — created by migration 001)
```sql
-- user_id (references auth.users), added_at, notes
```

---

## Plan Tier → Tool Unlock Mapping

| Plan | Credits | Resolution | Batch Generator | Premium Templates | Commercial |
|------|---------|------------|-----------------|-------------------|------------|
| Free Trial | 30 once | 720p | ✗ | ✗ | ✗ |
| Starter | 1,500/mo | 1080p | ✗ | ✗ | ✗ |
| Pro | 6,000/mo | 2K | ✓ | ✓ | ✗ |
| Agency | 10,000/mo | 4K | ✓ | ✓ | ✓ |

---

## Authentication Flow

### Website
1. User signs in with Supabase Auth (email/password)
2. Supabase issues JWT access token
3. Token is stored in browser localStorage by Supabase client
4. Dashboard reads plan and credits from Supabase using the same session

### Desktop App
1. User logs in via Electron embedded auth window
2. Desktop app receives JWT via deep-link callback
3. App calls Supabase API with JWT to read subscriptions + credit_balances
4. Plan and credits are cached locally and refreshed on startup

---

## Payment Flow (Manual)

1. User selects plan on `/upgrade` page
2. User sends payment via JazzCash / EasyPaisa / bank transfer
3. User submits transaction reference on the Upgrade page
4. Record inserted into `payment_requests` table (status: pending)
5. Admin reviews in `/admin` panel
6. Admin marks request as `approved`
7. Admin runs SQL to update `subscriptions` + `credit_balances`
8. Desktop app detects plan change on next startup

---

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=https://erbdkxqgyjsnmyvfnidc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Optional — download URLs (shows "Contact support" if blank)
VITE_WINDOWS_DOWNLOAD_URL=
VITE_MAC_DOWNLOAD_URL=
```

> Never expose the Supabase service role key in the frontend.

---

## Deployment Plan

### Website
- **Recommended host:** [Vercel](https://vercel.com)
  - Automatic CI/CD from GitHub
  - Add env vars in Vercel dashboard
- **Current version:** v0.1.1-stable desktop app

---

## Security Guidelines

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in the frontend
- Use **Supabase Row Level Security (RLS)** on all tables
- Only allow users to read/update their own rows
- Admin access is gated by the `admin_users` table (not a hidden route)
- Store secrets only in Vercel environment variables (not in code)

---

## Current Status

| Feature | Status |
|---------|--------|
| Website UI (all pages) | ✅ Complete |
| Supabase Auth (email/password) | ✅ Complete |
| Dashboard (plan + credits + usage) | ✅ Complete |
| Manual payment request flow | ✅ Complete |
| Admin panel (view + approve requests) | ✅ Complete |
| SQL migration (payment_requests + admin_users) | ✅ Created — needs to be run in Supabase |
| Download page (v0.1.1-stable) | ✅ Complete |
| Download URLs | 🔲 Pending — add to .env.local when release is published |
| Google OAuth | 🔲 Planned |
| Supabase Edge Function for plan activation | 🔲 Planned |
| Vercel deployment | 🔲 Planned |
| Custom domain | 🔲 Planned |

---

*Last updated: July 2026*
*SyncFrame Studio — Website Integration Plan v2.0*
