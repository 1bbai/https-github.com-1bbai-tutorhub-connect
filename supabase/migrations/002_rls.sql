-- ============================================================
-- Markham Office Services - Row Level Security Policies
-- Migration: 002_rls.sql
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: get current user's role
-- SECURITY DEFINER so it reads the users table regardless of
-- calling context; STABLE so the planner can cache it per query.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS
-- - Any authenticated user can read their own row
-- - Admin and staff can read all rows
-- - Users can update their own row; admin can update any row
-- - Only admin can create user rows directly
--   (normal path: created automatically by the auth trigger)
-- ============================================================
CREATE POLICY "users_select_own_or_staff_admin"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "users_update_own_or_admin"
  ON public.users FOR UPDATE
  USING (
    id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "users_insert_admin_only"
  ON public.users FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "users_delete_admin_only"
  ON public.users FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- CRM CONTACTS
-- Admin and staff have full access; clients have no access.
-- ============================================================
CREATE POLICY "crm_contacts_admin_staff_all"
  ON public.crm_contacts FOR ALL
  USING (public.get_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'staff'));

-- ============================================================
-- CRM PIPELINES
-- ============================================================
CREATE POLICY "crm_pipelines_admin_staff_all"
  ON public.crm_pipelines FOR ALL
  USING (public.get_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'staff'));

-- ============================================================
-- CRM PIPELINE STAGES
-- ============================================================
CREATE POLICY "crm_pipeline_stages_admin_staff_all"
  ON public.crm_pipeline_stages FOR ALL
  USING (public.get_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'staff'));

-- ============================================================
-- CRM DEALS
-- ============================================================
CREATE POLICY "crm_deals_admin_staff_all"
  ON public.crm_deals FOR ALL
  USING (public.get_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'staff'));

-- ============================================================
-- CRM ACTIVITIES
-- ============================================================
CREATE POLICY "crm_activities_admin_staff_all"
  ON public.crm_activities FOR ALL
  USING (public.get_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'staff'));

-- ============================================================
-- CRM TAGS
-- ============================================================
CREATE POLICY "crm_tags_admin_staff_all"
  ON public.crm_tags FOR ALL
  USING (public.get_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'staff'));

-- ============================================================
-- PLANS
-- Everyone can read active plans (needed for signup flow).
-- Only admin can create / update / delete plans.
-- ============================================================
CREATE POLICY "plans_select_all"
  ON public.plans FOR SELECT
  USING (true);

CREATE POLICY "plans_admin_insert"
  ON public.plans FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "plans_admin_update"
  ON public.plans FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "plans_admin_delete"
  ON public.plans FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- CLIENT SUBSCRIPTIONS
-- Clients see only their own; staff/admin see all.
-- Only admin can write.
-- ============================================================
CREATE POLICY "client_subscriptions_select"
  ON public.client_subscriptions FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "client_subscriptions_admin_insert"
  ON public.client_subscriptions FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "client_subscriptions_admin_update"
  ON public.client_subscriptions FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "client_subscriptions_admin_delete"
  ON public.client_subscriptions FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- PAYMENT METHODS
-- Clients see/manage their own; admin sees all.
-- ============================================================
CREATE POLICY "payment_methods_select"
  ON public.payment_methods FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "payment_methods_insert"
  ON public.payment_methods FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "payment_methods_update"
  ON public.payment_methods FOR UPDATE
  USING (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "payment_methods_delete"
  ON public.payment_methods FOR DELETE
  USING (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- ============================================================
-- INVOICES
-- Clients see their own; staff/admin see all.
-- Only admin can write.
-- ============================================================
CREATE POLICY "invoices_select"
  ON public.invoices FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "invoices_admin_insert"
  ON public.invoices FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "invoices_admin_update"
  ON public.invoices FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "invoices_admin_delete"
  ON public.invoices FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- SERVICES
-- Everyone can read active services.
-- Only admin can write.
-- ============================================================
CREATE POLICY "services_select_all"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "services_admin_insert"
  ON public.services FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "services_admin_update"
  ON public.services FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "services_admin_delete"
  ON public.services FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- CLIENT SERVICES
-- Clients see their own; staff/admin see all.
-- Only admin can write.
-- ============================================================
CREATE POLICY "client_services_select"
  ON public.client_services FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "client_services_admin_insert"
  ON public.client_services FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "client_services_admin_update"
  ON public.client_services FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "client_services_admin_delete"
  ON public.client_services FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- MEETING ROOMS
-- Everyone can read active rooms (needed for booking flow).
-- Only admin can write.
-- ============================================================
CREATE POLICY "meeting_rooms_select_all"
  ON public.meeting_rooms FOR SELECT
  USING (true);

CREATE POLICY "meeting_rooms_admin_insert"
  ON public.meeting_rooms FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "meeting_rooms_admin_update"
  ON public.meeting_rooms FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "meeting_rooms_admin_delete"
  ON public.meeting_rooms FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- ROOM BOOKINGS
-- Clients see/create their own; staff/admin see all; only
-- the booking owner or admin can update/cancel.
-- ============================================================
CREATE POLICY "room_bookings_select"
  ON public.room_bookings FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "room_bookings_insert"
  ON public.room_bookings FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "room_bookings_update"
  ON public.room_bookings FOR UPDATE
  USING (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "room_bookings_admin_delete"
  ON public.room_bookings FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- CREDIT LEDGER
-- Clients see their own credits; staff/admin see all.
-- Inserts allowed for the client themselves (booking flow)
-- or admin (manual adjustments).
-- Ledger rows are never updated or deleted (append-only).
-- ============================================================
CREATE POLICY "credit_ledger_select"
  ON public.credit_ledger FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "credit_ledger_insert"
  ON public.credit_ledger FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- ============================================================
-- TASKS
-- Clients see tasks where they are the client.
-- Staff/admin see all tasks.
-- Staff/admin and the assigned user can update.
-- Only admin can delete.
-- ============================================================
CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (
    client_id    = auth.uid()
    OR assigned_to = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR public.get_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "tasks_admin_delete"
  ON public.tasks FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- TASK COMMENTS
-- Visible to anyone who can see the parent task.
-- Authors can insert their own comments.
-- Authors or admin can delete their comments.
-- ============================================================
CREATE POLICY "task_comments_select"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND (
          t.client_id    = auth.uid()
          OR t.assigned_to = auth.uid()
          OR public.get_user_role() IN ('admin', 'staff')
        )
    )
  );

CREATE POLICY "task_comments_insert"
  ON public.task_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "task_comments_delete"
  ON public.task_comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- ============================================================
-- TASK ATTACHMENTS
-- Same visibility rules as task comments.
-- ============================================================
CREATE POLICY "task_attachments_select"
  ON public.task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND (
          t.client_id    = auth.uid()
          OR t.assigned_to = auth.uid()
          OR public.get_user_role() IN ('admin', 'staff')
        )
    )
  );

CREATE POLICY "task_attachments_insert"
  ON public.task_attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "task_attachments_delete"
  ON public.task_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- ============================================================
-- NOTIFICATIONS
-- Each user manages only their own notifications.
-- ============================================================
CREATE POLICY "notifications_own_all"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE POLICY "notification_preferences_own_all"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
