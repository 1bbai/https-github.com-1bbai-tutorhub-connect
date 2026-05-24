-- ============================================================
-- Markham Office Services - Database Schema
-- Migration: 001_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL UNIQUE,
  full_name     TEXT        NOT NULL,
  phone         TEXT,
  company_name  TEXT,
  role          TEXT        NOT NULL DEFAULT 'client'
                              CHECK (role IN ('admin', 'staff', 'client')),
  avatar_url    TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  invited_by    UUID        REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRM CONTACTS
-- ============================================================
CREATE TABLE public.crm_contacts (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  email         TEXT,
  phone         TEXT,
  company_name  TEXT,
  website       TEXT,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  postal_code   TEXT,
  country       TEXT        DEFAULT 'Canada',
  status        TEXT        NOT NULL DEFAULT 'lead'
                              CHECK (status IN ('lead', 'prospect', 'active', 'inactive', 'churned')),
  source        TEXT        NOT NULL DEFAULT 'other'
                              CHECK (source IN ('referral', 'website', 'cold_outreach', 'walk_in', 'other')),
  assigned_to   UUID        REFERENCES public.users(id),
  tags          TEXT[]      DEFAULT '{}',
  notes         TEXT,
  linked_user_id UUID       REFERENCES public.users(id),
  created_by    UUID        REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRM PIPELINES
-- ============================================================
CREATE TABLE public.crm_pipelines (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  description TEXT,
  is_default  BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRM PIPELINE STAGES
-- ============================================================
CREATE TABLE public.crm_pipeline_stages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID        NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  order_index INTEGER     NOT NULL,
  color       TEXT        DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRM DEALS
-- ============================================================
CREATE TABLE public.crm_deals (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id          UUID        NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  pipeline_id         UUID        NOT NULL REFERENCES public.crm_pipelines(id),
  stage_id            UUID        NOT NULL REFERENCES public.crm_pipeline_stages(id),
  title               TEXT        NOT NULL,
  value               NUMERIC(10,2) DEFAULT 0,
  currency            TEXT        DEFAULT 'CAD',
  status              TEXT        NOT NULL DEFAULT 'open'
                                    CHECK (status IN ('open', 'won', 'lost')),
  expected_close_date DATE,
  assigned_to         UUID        REFERENCES public.users(id),
  notes               TEXT,
  created_by          UUID        REFERENCES public.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRM ACTIVITIES
-- ============================================================
CREATE TABLE public.crm_activities (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id  UUID        NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id     UUID        REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  type        TEXT        NOT NULL
                            CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'sms', 'system')),
  subject     TEXT        NOT NULL,
  body        TEXT,
  direction   TEXT        CHECK (direction IN ('inbound', 'outbound')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID        REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRM TAGS
-- ============================================================
CREATE TABLE public.crm_tags (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  color      TEXT        DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PLANS
-- ============================================================
CREATE TABLE public.plans (
  id                            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                          TEXT        NOT NULL,
  description                   TEXT,
  price_monthly                 NUMERIC(10,2) NOT NULL,
  stripe_price_id               TEXT,
  meeting_room_credits_per_month INTEGER     DEFAULT 0,
  features                      JSONB       DEFAULT '[]',
  is_active                     BOOLEAN     DEFAULT true,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENT SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.client_subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id               UUID        NOT NULL REFERENCES public.plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id    TEXT,
  status                TEXT        NOT NULL DEFAULT 'active'
                                      CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  credits_remaining     INTEGER     DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
CREATE TABLE public.payment_methods (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id                UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT        NOT NULL,
  brand                    TEXT,
  last4                    TEXT,
  exp_month                INTEGER,
  exp_year                 INTEGER,
  is_default               BOOLEAN     DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE public.invoices (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount_cents     INTEGER     NOT NULL,
  currency         TEXT        DEFAULT 'CAD',
  status           TEXT        NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('paid', 'open', 'void', 'uncollectible')),
  description      TEXT,
  invoice_pdf_url  TEXT,
  period_start     TIMESTAMPTZ,
  period_end       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE public.services (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL
                            CHECK (category IN ('virtual_office', 'loan_assistance', 'business_registration')),
  description TEXT,
  price_cents INTEGER     DEFAULT 0,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENT SERVICES
-- ============================================================
CREATE TABLE public.client_services (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id  UUID        NOT NULL REFERENCES public.services(id),
  status      TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('active', 'pending', 'completed', 'expired')),
  start_date  DATE,
  expiry_date DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEETING ROOMS
-- ============================================================
CREATE TABLE public.meeting_rooms (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT        NOT NULL,
  description      TEXT,
  capacity         INTEGER     DEFAULT 1,
  credits_per_hour INTEGER     DEFAULT 1,
  amenities        JSONB       DEFAULT '[]',
  images           JSONB       DEFAULT '[]',
  is_active        BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOM BOOKINGS
-- ============================================================
CREATE TABLE public.room_bookings (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id        UUID        NOT NULL REFERENCES public.meeting_rooms(id),
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL,
  credits_used   INTEGER     NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'confirmed'
                               CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes          TEXT,
  cancelled_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT room_bookings_end_after_start CHECK (end_time > start_time)
);

-- ============================================================
-- CREDIT LEDGER
-- ============================================================
CREATE TABLE public.credit_ledger (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id    UUID        REFERENCES public.room_bookings(id) ON DELETE SET NULL,
  type          TEXT        NOT NULL CHECK (type IN ('credit', 'debit')),
  amount        INTEGER     NOT NULL,
  reason        TEXT        NOT NULL,
  balance_after INTEGER     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE public.tasks (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT        NOT NULL,
  description      TEXT,
  client_id        UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to      UUID        REFERENCES public.users(id),
  created_by       UUID        REFERENCES public.users(id),
  service_category TEXT        CHECK (service_category IN (
                                 'virtual_office', 'loan_assistance',
                                 'business_registration', 'room', 'general'
                               )),
  priority         TEXT        NOT NULL DEFAULT 'medium'
                                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status           TEXT        NOT NULL DEFAULT 'open'
                                 CHECK (status IN (
                                   'open', 'in_progress', 'awaiting_client',
                                   'completed', 'cancelled'
                                 )),
  due_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
CREATE TABLE public.task_comments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.users(id),
  body        TEXT        NOT NULL,
  attachments JSONB       DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASK ATTACHMENTS
-- ============================================================
CREATE TABLE public.task_attachments (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploaded_by  UUID        NOT NULL REFERENCES public.users(id),
  file_url     TEXT        NOT NULL,
  file_name    TEXT        NOT NULL,
  file_size    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE public.notification_preferences (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type      TEXT    NOT NULL,
  email_enabled   BOOLEAN DEFAULT true,
  sms_enabled     BOOLEAN DEFAULT false,
  in_app_enabled  BOOLEAN DEFAULT true,
  UNIQUE(user_id, event_type)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_crm_contacts_assigned_to   ON public.crm_contacts(assigned_to);
CREATE INDEX idx_crm_contacts_status        ON public.crm_contacts(status);
CREATE INDEX idx_crm_contacts_linked_user   ON public.crm_contacts(linked_user_id);
CREATE INDEX idx_crm_contacts_email         ON public.crm_contacts(email);
CREATE INDEX idx_crm_deals_pipeline_stage   ON public.crm_deals(pipeline_id, stage_id);
CREATE INDEX idx_crm_deals_contact          ON public.crm_deals(contact_id);
CREATE INDEX idx_crm_deals_status           ON public.crm_deals(status);
CREATE INDEX idx_crm_activities_contact     ON public.crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal        ON public.crm_activities(deal_id);
CREATE INDEX idx_crm_activities_occurred_at ON public.crm_activities(occurred_at DESC);
CREATE INDEX idx_tasks_client               ON public.tasks(client_id);
CREATE INDEX idx_tasks_assigned_to          ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status               ON public.tasks(status);
CREATE INDEX idx_tasks_due_date             ON public.tasks(due_date);
CREATE INDEX idx_room_bookings_client       ON public.room_bookings(client_id);
CREATE INDEX idx_room_bookings_room         ON public.room_bookings(room_id);
CREATE INDEX idx_room_bookings_times        ON public.room_bookings(start_time, end_time);
CREATE INDEX idx_room_bookings_status       ON public.room_bookings(status);
CREATE INDEX idx_notifications_user         ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at   ON public.notifications(created_at DESC);
CREATE INDEX idx_credit_ledger_client       ON public.credit_ledger(client_id);
CREATE INDEX idx_credit_ledger_booking      ON public.credit_ledger(booking_id);
CREATE INDEX idx_client_subscriptions_client ON public.client_subscriptions(client_id);
CREATE INDEX idx_invoices_client            ON public.invoices(client_id);
CREATE INDEX idx_invoices_status            ON public.invoices(status);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- USER CREATION TRIGGER
-- Automatically creates a public.users row when a new
-- auth.users record is inserted via Supabase Auth.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
