# Markham Office Services — Business Management App

Full-stack business management platform for [markhamoffice.com](https://markhamoffice.com), built with Next.js 14, Supabase, Stripe, shadcn/ui, SendGrid, and Twilio.

## Features

### Internal (Admin + Staff)
- **Built-in CRM** — contact management, activity timeline, pipeline kanban with drag-and-drop deals
- **Client management** — full client detail: plan, credits, services, bookings, invoices, CRM link
- **Task management** — kanban board (Open → In Progress → Awaiting Client → Completed), comments, attachments
- **Room management** — room CRUD, calendar view of bookings, manual booking creation
- **Services & Plans** — manage Stripe-linked plans and services; assign to clients
- **Reports** — revenue chart, clients by plan, bookings trend, task completion rate, CRM funnel
- **Settings** — SendGrid / Twilio / Stripe integration status; business profile; notification triggers

### Client Portal
- **Dashboard** — welcome, credits bar, quick actions, active services, upcoming bookings
- **My Plan** — current plan details, upgrade/downgrade, cancellation flow
- **Billing** — saved payment methods (Stripe Elements), invoice history with PDF download
- **Room Booking** — browse rooms, 3-step booking flow (date → time/duration → confirm), credit ledger
- **Services** — view active services with status, dates, and staff notes
- **Support** — submit requests, real-time chat-style comment thread with staff
- **Profile** — edit info, change password, per-event email/SMS notification preferences

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT, role-based) |
| Payments | Stripe (subscriptions, SetupIntent, webhooks) |
| Email | SendGrid (dynamic templates) |
| SMS | Twilio |
| Deployment | Vercel + Supabase (hosted) |

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd markham-office-app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local` (see [Environment Variables](#environment-variables) below).

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key** into `.env.local`
3. Copy your **service role key** into `.env.local` (used server-side only)
4. Run migrations in the Supabase SQL editor (or via CLI):

```bash
# Option A — Supabase CLI
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

```sql
-- Option B — paste into Supabase SQL editor, in order:
-- 1. supabase/migrations/001_schema.sql
-- 2. supabase/migrations/002_rls.sql
```

5. **Create test auth users** in Supabase Dashboard → Authentication → Users, then run `supabase/seed.sql` in the SQL editor to populate test data. The seed file includes instructions for matching user IDs.

### 4. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Copy **Publishable key** and **Secret key** into `.env.local`
3. Create products and prices in the Stripe Dashboard matching your plans; copy Price IDs into the `plans.stripe_price_id` column
4. Set up the webhook endpoint:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the **webhook signing secret** displayed into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

Events to enable in production webhook:
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_method.attached`
- `payment_method.detached`

### 5. Set up SendGrid

1. Create an account at [sendgrid.com](https://sendgrid.com)
2. Verify your sender email address
3. Create **Dynamic Templates** for each event type and copy the Template IDs into `.env.local`:

| Variable | Purpose |
|----------|---------|
| `SENDGRID_TEMPLATE_INVITE` | Client invitation email |
| `SENDGRID_TEMPLATE_BOOKING_CONFIRMED` | Booking confirmation |
| `SENDGRID_TEMPLATE_BOOKING_CANCELLED` | Booking cancellation |
| `SENDGRID_TEMPLATE_PAYMENT_SUCCESS` | Invoice paid |
| `SENDGRID_TEMPLATE_PAYMENT_FAILED` | Payment failure |
| `SENDGRID_TEMPLATE_TASK_UPDATED` | Task status changed |
| `SENDGRID_TEMPLATE_LOW_CREDITS` | Credits below 2 |

### 6. Set up Twilio (optional — SMS only)

1. Create an account at [twilio.com](https://twilio.com)
2. Buy a phone number
3. Copy **Account SID**, **Auth Token**, and **phone number** into `.env.local`

SMS is only sent for time-sensitive events: booking confirmed/cancelled, payment failed, low credits. If Twilio is not configured, SMS sends are silently skipped.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Test Accounts

After running `supabase/seed.sql`, create matching auth users in Supabase Dashboard → Authentication → Users with these emails (use any password):

| Role | Email | Company |
|------|-------|---------|
| Admin | admin@markhamoffice.com | Markham Office Services |
| Staff | sarah@markhamoffice.com | — |
| Staff | david@markhamoffice.com | — |
| Client | priya@horizontech.ca | Horizon Tech Solutions |
| Client | mike@goldendragonfood.ca | Golden Dragon Foods |
| Client | fatima@novahealth.ca | Nova Health Consulting |

> **Note:** After creating auth users, update the `id` values in `supabase/seed.sql` to match the UUIDs generated by Supabase Auth, then re-run the seed.

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@markhamoffice.com
SENDGRID_FROM_NAME=Markham Office Services
SENDGRID_TEMPLATE_INVITE=d-...
SENDGRID_TEMPLATE_BOOKING_CONFIRMED=d-...
SENDGRID_TEMPLATE_BOOKING_CANCELLED=d-...
SENDGRID_TEMPLATE_PAYMENT_SUCCESS=d-...
SENDGRID_TEMPLATE_PAYMENT_FAILED=d-...
SENDGRID_TEMPLATE_TASK_UPDATED=d-...
SENDGRID_TEMPLATE_LOW_CREDITS=d-...

# Twilio (optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
/app
  /(auth)          login, forgot-password, reset-password, accept-invite
  /(admin)         dashboard, crm/contacts, crm/deals, clients, tasks,
                   rooms, services, reports, settings
  /(staff)         dashboard, crm/contacts, clients, tasks
  /(client)        home, plan, billing, rooms, services, support, profile
  /api
    stripe/webhook/       Stripe webhook handler
    billing/              setup-intent, payment-methods, subscription
    bookings/             create, availability, cancel
    support/requests/     create, list, comment thread
    notifications/        list, mark-read
    profile/              update profile, notification preferences
    admin/clients/        list, create, credit adjustments
    admin/invite/         send invitation

/components
  /ui              shadcn/ui base components (20+)
  /shared          Sidebar, TopNav, NotificationBell, StatCard,
                   EmptyState, LoadingSkeleton, ConfirmDialog, RoleBadge
  /admin           AdminShell, AdminDashboard, ClientList, ClientDetail,
                   TaskBoard, RoomManagement, ServiceManagement,
                   SettingsPanel, ReportsCharts
  /staff           StaffShell, StaffDashboard
  /client          ClientShell, PortalDashboard, PlanPage, BillingPanel,
                   RoomBrowser, ServiceCards, SupportThread, ProfilePage
  /crm             ContactList, ContactDetail, ActivityTimeline,
                   DealKanban, DealDrawer

/lib
  /supabase        client.ts, server.ts, admin.ts
  /stripe          client.ts, subscriptions.ts, payment-methods.ts,
                   webhooks.ts
  /credits         credit-engine.ts
  /crm             contact-helpers.ts, activity-logger.ts,
                   pipeline-helpers.ts
  /sendgrid        sender.ts
  /twilio          sms.ts
  utils.ts

/types             database.ts (all table types + Database generic)
/hooks             useAuth.ts, useNotifications.ts, useCredits.ts
/supabase
  /migrations      001_schema.sql, 002_rls.sql
  seed.sql
```

## Deployment (Vercel + Supabase)

1. Push your branch to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel → Project → Settings → Environment Variables
4. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://app.markhamoffice.com`)
5. In Stripe Dashboard, add a **Production** webhook endpoint: `https://app.markhamoffice.com/api/stripe/webhook`
6. Supabase is already hosted — ensure production env vars point to your production Supabase project

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access: CRM, all clients, billing settings, staff management, reports |
| `staff` | CRM contacts/deals, assigned tasks, client profiles (read-only billing) |
| `client` | Own portal only: plan, billing, bookings, services, support |

Role-based access is enforced at three layers:
1. **Next.js middleware** — redirects unauthorized routes before rendering
2. **Supabase RLS** — database-level row access per role
3. **API routes** — server-side role checks on every mutation
