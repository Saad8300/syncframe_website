# WEBSITE_INTEGRATION_PLAN.md

# SyncFrame Studio — Website Integration Plan

This document outlines the full future integration flow between the SyncFrame Studio website and the desktop application.

---

## Overview

SyncFrame Studio consists of two separate systems:

| System | Responsibility |
|--------|----------------|
| **Website** (`syncframe-website`) | Marketing, pricing, download, login, account management, payment flow |
| **Desktop App** (`syncframe-desktop-lab`) | Local rendering, timeline tools, batch generation, credit usage, plan checks |

---

## Future User Flow

```
1. User visits SyncFrame website
        ↓
2. User downloads the desktop app from the Download page
        ↓
3. User creates an account or logs in (website)
        ↓
4. User selects and purchases a plan (Standard / Pro / Ultra)
        ↓
5. Payment webhook fires → updates Supabase user record
        (plan tier, credits, billing cycle, next renewal date)
        ↓
6. User opens the SyncFrame Studio desktop app
        ↓
7. User logs in with the same email
        ↓
8. Desktop app reads plan and credits from Supabase
        ↓
9. Tools unlock automatically based on plan tier
        ↓
10. User creates videos and consumes credits
```

---

## Component Responsibilities

### Website (this repo)
- Public marketing pages (Home, Features, Pricing, Changelog)
- User authentication UI (email + Google OAuth via Supabase)
- Account dashboard (plan status, credits, subscription management)
- Payment flow (Stripe or LemonSqueezy — future integration)
- Webhook receiver for payment events

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
- **Authentication:** Supabase Auth (email + Google OAuth)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel (recommended)
- **Payments:** Stripe or LemonSqueezy (future)

### Desktop App
- Electron (or Tauri)
- Supabase JS client for auth and data reads
- Local rendering engine (no cloud uploads)

---

## Supabase Schema (Planned)

### Table: `profiles`
```sql
create table profiles (
  id          uuid references auth.users primary key,
  email       text not null,
  full_name   text,
  plan        text default 'free',      -- 'free' | 'standard' | 'pro' | 'ultra'
  credits     integer default 30,
  credits_max integer default 30,
  billing_cycle_end timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

### Table: `credit_transactions`
```sql
create table credit_transactions (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id),
  amount     integer,                    -- negative = consumed, positive = refund/top-up
  reason     text,                       -- e.g. 'export_1080p', 'monthly_refresh'
  created_at timestamptz default now()
);
```

### Table: `payment_events`
```sql
create table payment_events (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id),
  provider   text,                       -- 'stripe' | 'lemonsqueezy'
  event_type text,                       -- 'subscription.created' | 'subscription.updated' | etc.
  plan       text,
  payload    jsonb,
  created_at timestamptz default now()
);
```

---

## Plan Tier → Tool Unlock Mapping

| Plan     | Credits | Resolution | Batch Generator | Webhooks | Templates | Commercial |
|----------|---------|------------|-----------------|----------|-----------|------------|
| Free     | 30 once | 720p       | ✗               | ✗        | Basic     | ✗          |
| Standard | 500/mo  | 1080p      | ✗               | ✗        | Limited   | ✗          |
| Pro      | 2000/mo | 2K         | ✓               | ✓        | Premium   | ✗          |
| Ultra    | 10000/mo| 4K         | ✓               | ✓        | Premium   | ✓          |

---

## Authentication Flow

### Website
1. User signs in with Supabase Auth (email/password or Google OAuth)
2. Supabase issues JWT access token
3. Token is stored in browser localStorage by Supabase client
4. Token is also made available for desktop app pickup

### Desktop App
1. Opens embedded browser auth window (or accepts manual paste)
2. User authenticates on website
3. Desktop app receives JWT
4. App calls Supabase API with JWT to read `profiles` table
5. Plan and credits are cached locally and refreshed on startup

---

## Payment Integration (Future)

### Provider Options
- **Stripe** — Best for SaaS subscriptions, webhooks, portal
- **LemonSqueezy** — Simpler for indie products, handles VAT automatically

### Flow
1. User clicks "Subscribe" on pricing page
2. Redirected to Stripe/LemonSqueezy checkout
3. On success, payment provider fires webhook to website endpoint
4. Endpoint updates `profiles.plan` and `profiles.credits` in Supabase
5. Desktop app detects plan change on next startup

### Webhook Endpoint (Future — Edge Function or Serverless)
```
POST /api/webhooks/stripe
POST /api/webhooks/lemonsqueezy
```

---

## Deployment Plan

### Website
- **Recommended host:** [Vercel](https://vercel.com)
  - Automatic CI/CD from GitHub
  - Edge functions for webhook endpoints
  - Free tier sufficient for launch
- **Custom domain:** `syncframestudio.com` (future)
- **Environment variables needed:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `STRIPE_SECRET_KEY` (server-only, not in Vite build)
  - `STRIPE_WEBHOOK_SECRET` (server-only)

### Desktop App
- Distributed from the Download page
- Auto-update via GitHub Releases or custom update server
- Code-signed for Mac (Apple notarization) and Windows (EV cert)

---

## Security Guidelines

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in the frontend
- Use **Supabase Row Level Security (RLS)** on all tables
- Only allow users to read/update their own `profiles` row
- Store secrets only in Vercel environment variables (not in code)
- Validate all webhook payloads with signature verification

---

## Current Status

| Feature | Status |
|---------|--------|
| Website UI (all pages) | ✅ Complete |
| Auth UI foundation | ✅ Complete (placeholder) |
| Supabase Auth integration | 🔲 Planned |
| Payment integration | 🔲 Planned |
| Webhook endpoint | 🔲 Planned |
| Desktop app auth | 🔲 Planned |
| Vercel deployment | 🔲 Planned |
| Custom domain | 🔲 Planned |

---

*Last updated: June 2025*
*SyncFrame Studio — Website Integration Plan v1.0*
