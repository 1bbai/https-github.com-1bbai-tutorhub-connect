-- ============================================================
-- Markham Office Services - Seed Data
-- supabase/seed.sql
-- ============================================================
--
-- IMPORTANT: Supabase Auth users (auth.users) cannot be inserted
-- directly in seed SQL because passwords are hashed by Supabase's
-- GoTrue service, and the auth schema is managed internally.
--
-- To set up test accounts:
--   1. Run this seed file AFTER creating auth users through one of:
--        a) Supabase Dashboard → Authentication → Add user
--        b) supabase auth add-user (CLI)
--        c) supabase/tests/create_auth_users.ts (helper script)
--   2. Use the UUIDs assigned by GoTrue and update the constants
--      below before running, OR run this seed after the trigger
--      (handle_new_user) has already created public.users rows,
--      then use UPDATE statements to set role/phone/company_name.
--
-- For local dev with `supabase start`, you may insert directly into
-- auth.users using the service-role key or via the Inbucket email UI.
-- The UUIDs below are fixed so foreign keys resolve correctly across
-- all seed tables.
-- ============================================================

-- ============================================================
-- FIXED TEST UUIDs
-- ============================================================
-- Admin
-- admin_id  : 00000000-0000-0000-0000-000000000001
-- Staff 1   : 00000000-0000-0000-0000-000000000002
-- Staff 2   : 00000000-0000-0000-0000-000000000003
-- Client 1  : 00000000-0000-0000-0000-000000000004
-- Client 2  : 00000000-0000-0000-0000-000000000005
-- Client 3  : 00000000-0000-0000-0000-000000000006

-- ============================================================
-- 0. TEMPORARILY DISABLE THE AUTH TRIGGER SO WE CAN INSERT
--    DIRECTLY INTO public.users WITH KNOWN UUIDs
--    (the trigger would try to write to auth.users first)
-- ============================================================
ALTER TABLE public.users DISABLE TRIGGER on_auth_user_created;

-- ============================================================
-- 1. USERS  (admin · staff · clients)
-- ============================================================
INSERT INTO public.users (id, email, full_name, phone, company_name, role, is_active, created_at, updated_at)
VALUES
  -- Admin
  ('00000000-0000-0000-0000-000000000001',
   'admin@markhamoffice.com',
   'Jackie Chan',
   '905-555-0101',
   'Markham Office Services',
   'admin',
   true,
   NOW() - INTERVAL '180 days',
   NOW() - INTERVAL '1 day'),

  -- Staff 1
  ('00000000-0000-0000-0000-000000000002',
   'sarah.lee@markhamoffice.com',
   'Sarah Lee',
   '905-555-0102',
   'Markham Office Services',
   'staff',
   true,
   NOW() - INTERVAL '120 days',
   NOW() - INTERVAL '5 days'),

  -- Staff 2
  ('00000000-0000-0000-0000-000000000003',
   'david.wong@markhamoffice.com',
   'David Wong',
   '905-555-0103',
   'Markham Office Services',
   'staff',
   true,
   NOW() - INTERVAL '90 days',
   NOW() - INTERVAL '10 days'),

  -- Client 1
  ('00000000-0000-0000-0000-000000000004',
   'priya.sharma@horizontech.ca',
   'Priya Sharma',
   '647-555-0201',
   'Horizon Tech Solutions Inc.',
   'client',
   true,
   NOW() - INTERVAL '60 days',
   NOW() - INTERVAL '2 days'),

  -- Client 2
  ('00000000-0000-0000-0000-000000000005',
   'mike.chen@goldendragon.ca',
   'Mike Chen',
   '416-555-0202',
   'Golden Dragon Import & Export Ltd.',
   'client',
   true,
   NOW() - INTERVAL '45 days',
   NOW() - INTERVAL '7 days'),

  -- Client 3
  ('00000000-0000-0000-0000-000000000006',
   'fatima.ali@novahealth.ca',
   'Fatima Ali',
   '905-555-0203',
   'Nova Health Consulting',
   'client',
   true,
   NOW() - INTERVAL '30 days',
   NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Re-enable trigger
ALTER TABLE public.users ENABLE TRIGGER on_auth_user_created;

-- ============================================================
-- 2. PLANS
-- ============================================================
INSERT INTO public.plans (id, name, description, price_monthly, stripe_price_id, meeting_room_credits_per_month, features, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001',
   'Starter',
   'Perfect for solo entrepreneurs and freelancers who need a professional address.',
   49.00,
   'price_starter_monthly',
   2,
   '["Professional Markham business address", "Mail receipt & forwarding", "2 meeting room credits/month", "Business registration support"]',
   true),

  ('10000000-0000-0000-0000-000000000002',
   'Professional',
   'Ideal for growing businesses that need regular meeting space and enhanced services.',
   129.00,
   'price_professional_monthly',
   8,
   '["Everything in Starter", "8 meeting room credits/month", "Dedicated phone answering (10 calls/mo)", "Loan consultation (1 session/mo)", "Priority support"]',
   true),

  ('10000000-0000-0000-0000-000000000003',
   'Business',
   'Full-service plan for established businesses with heavy meeting and admin needs.',
   249.00,
   'price_business_monthly',
   20,
   '["Everything in Professional", "20 meeting room credits/month", "Unlimited phone answering", "Monthly business health review", "Dedicated account manager", "Priority loan referrals"]',
   true),

  ('10000000-0000-0000-0000-000000000004',
   'Enterprise',
   'Custom solutions for corporations requiring full concierge business support.',
   499.00,
   'price_enterprise_monthly',
   60,
   '["Everything in Business", "60 meeting room credits/month", "Custom contract", "On-site staff support (4 hrs/mo)", "Government filing assistance", "Dedicated lounge access"]',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. CLIENT SUBSCRIPTIONS
-- ============================================================
INSERT INTO public.client_subscriptions
  (id, client_id, plan_id, stripe_subscription_id, stripe_customer_id,
   status, current_period_start, current_period_end, credits_remaining)
VALUES
  ('20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',   -- Priya Sharma
   '10000000-0000-0000-0000-000000000002',   -- Professional
   'sub_priya_pro_001',
   'cus_priya_001',
   'active',
   NOW() - INTERVAL '15 days',
   NOW() + INTERVAL '15 days',
   5),

  ('20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000005',   -- Mike Chen
   '10000000-0000-0000-0000-000000000003',   -- Business
   'sub_mike_biz_001',
   'cus_mike_001',
   'active',
   NOW() - INTERVAL '20 days',
   NOW() + INTERVAL '10 days',
   14),

  ('20000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000006',   -- Fatima Ali
   '10000000-0000-0000-0000-000000000001',   -- Starter
   'sub_fatima_start_001',
   'cus_fatima_001',
   'trialing',
   NOW() - INTERVAL '5 days',
   NOW() + INTERVAL '25 days',
   2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. SERVICES
-- ============================================================
INSERT INTO public.services (id, name, category, description, price_cents, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001',
   'Virtual Office – Basic Address',
   'virtual_office',
   'Professional Markham business address for mail receipt and business registration.',
   4900,
   true),

  ('30000000-0000-0000-0000-000000000002',
   'Virtual Office – Phone Answering',
   'virtual_office',
   'Live receptionist answers calls in your company name during business hours.',
   7900,
   true),

  ('30000000-0000-0000-0000-000000000003',
   'Virtual Office – Mail Forwarding',
   'virtual_office',
   'Weekly mail forwarding to any Canadian address.',
   1500,
   true),

  ('30000000-0000-0000-0000-000000000004',
   'SBA Loan Consultation',
   'loan_assistance',
   'One-on-one session with a loan specialist to assess eligibility and prepare documentation.',
   15000,
   true),

  ('30000000-0000-0000-0000-000000000005',
   'Business Loan Application Package',
   'loan_assistance',
   'Full assistance preparing and submitting a business loan application (up to 3 lenders).',
   49900,
   true),

  ('30000000-0000-0000-0000-000000000006',
   'Ontario Business Registration',
   'business_registration',
   'Register a sole proprietorship or partnership with Service Ontario.',
   14900,
   true),

  ('30000000-0000-0000-0000-000000000007',
   'Federal Corporation Incorporation',
   'business_registration',
   'Full incorporation service including NUANS name search and Articles of Incorporation filing.',
   59900,
   true),

  ('30000000-0000-0000-0000-000000000008',
   'CRA Business Number Registration',
   'business_registration',
   'Register for GST/HST, Payroll, and Import/Export accounts with CRA.',
   9900,
   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. CLIENT SERVICES
-- ============================================================
INSERT INTO public.client_services (id, client_id, service_id, status, start_date, expiry_date, notes)
VALUES
  -- Priya Sharma
  ('31000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000001',   -- Virtual Office Address
   'active',
   CURRENT_DATE - INTERVAL '60 days',
   CURRENT_DATE + INTERVAL '305 days',
   'Address used for CRA registration and business cards.'),

  ('31000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000002',   -- Phone Answering
   'active',
   CURRENT_DATE - INTERVAL '60 days',
   CURRENT_DATE + INTERVAL '305 days',
   'Calls forwarded to 647-555-0201 after hours.'),

  -- Mike Chen
  ('31000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000005',
   '30000000-0000-0000-0000-000000000001',   -- Virtual Office Address
   'active',
   CURRENT_DATE - INTERVAL '45 days',
   CURRENT_DATE + INTERVAL '320 days',
   'Primary business address on CRA and WSIB filings.'),

  ('31000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000005',
   '30000000-0000-0000-0000-000000000005',   -- Business Loan Application
   'pending',
   NULL,
   NULL,
   'Waiting on 2023 T2 corporate return before submission.'),

  -- Fatima Ali
  ('31000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000006',
   '30000000-0000-0000-0000-000000000006',   -- Ontario Business Registration
   'completed',
   CURRENT_DATE - INTERVAL '25 days',
   NULL,
   'Registration completed. BN: 123456789RT0001.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. MEETING ROOMS
-- ============================================================
INSERT INTO public.meeting_rooms (id, name, description, capacity, credits_per_hour, amenities, images, is_active)
VALUES
  ('40000000-0000-0000-0000-000000000001',
   'Boardroom A – The Maple Suite',
   'Elegant 10-person boardroom with 4K display, video conferencing, and natural light. Perfect for client presentations and team strategy sessions.',
   10,
   2,
   '["4K 75\" Display", "Video conferencing (Zoom/Teams)", "Whiteboard wall", "High-speed Wi-Fi", "Coffee & tea service", "Natural window light", "HDMI & USB-C inputs"]',
   '["https://cdn.markhamoffice.ca/rooms/maple-suite-1.jpg", "https://cdn.markhamoffice.ca/rooms/maple-suite-2.jpg"]',
   true),

  ('40000000-0000-0000-0000-000000000002',
   'Focus Room B – The Cedar Pod',
   'Private 4-person focus room designed for deep-work sessions, interviews, and confidential calls.',
   4,
   1,
   '["55\" Display", "Acoustic panels (sound-proofed)", "Webcam & microphone", "High-speed Wi-Fi", "Standing desk option", "USB hub"]',
   '["https://cdn.markhamoffice.ca/rooms/cedar-pod-1.jpg"]',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. ROOM BOOKINGS
-- ============================================================
INSERT INTO public.room_bookings
  (id, client_id, room_id, start_time, end_time, duration_hours, credits_used, status, notes)
VALUES
  -- Priya Sharma – completed booking last week (Boardroom A, 2 hrs)
  ('50000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',
   '40000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '8 days' + INTERVAL '10 hours',
   NOW() - INTERVAL '8 days' + INTERVAL '12 hours',
   2.00,
   4,
   'completed',
   'Investor pitch rehearsal. Please set up projector in advance.'),

  -- Mike Chen – completed booking 3 days ago (Cedar Pod, 1 hr)
  ('50000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000002',
   NOW() - INTERVAL '3 days' + INTERVAL '14 hours',
   NOW() - INTERVAL '3 days' + INTERVAL '15 hours',
   1.00,
   1,
   'completed',
   'Phone interview with potential hire.'),

  -- Priya Sharma – upcoming booking tomorrow (Boardroom A, 3 hrs)
  ('50000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000004',
   '40000000-0000-0000-0000-000000000001',
   NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
   NOW() + INTERVAL '1 day' + INTERVAL '12 hours',
   3.00,
   6,
   'confirmed',
   'Quarterly board meeting with 3 external guests.'),

  -- Fatima Ali – upcoming booking in 2 days (Cedar Pod, 1.5 hrs)
  ('50000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000006',
   '40000000-0000-0000-0000-000000000002',
   NOW() + INTERVAL '2 days' + INTERVAL '13 hours',
   NOW() + INTERVAL '2 days' + INTERVAL '14 hours' + INTERVAL '30 minutes',
   1.50,
   2,
   'confirmed',
   'Initial client consultation – healthcare compliance review.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. CREDIT LEDGER
-- ============================================================
INSERT INTO public.credit_ledger (id, client_id, booking_id, type, amount, reason, balance_after)
VALUES
  -- Priya: initial 8 credits on subscription start
  ('60000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',
   NULL, 'credit', 8, 'Monthly credit allocation – Professional plan', 8),

  -- Priya: debit 4 credits for booking 1
  ('60000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000004',
   '50000000-0000-0000-0000-000000000001', 'debit', 4, 'Room booking – Maple Suite (2 hrs)', 4),

  -- Priya: debit 6 credits for booking 3 (upcoming, pre-authorized)
  -- Note: balance goes negative by 1; staff top-up adjusts it
  ('60000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000004',
   '50000000-0000-0000-0000-000000000003', 'debit', 6, 'Room booking – Maple Suite (3 hrs)', -2),

  -- Priya: admin top-up to bring balance to 5
  ('60000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000004',
   NULL, 'credit', 7, 'Admin top-up – goodwill credit', 5),

  -- Mike: initial 20 credits on subscription start
  ('60000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000005',
   NULL, 'credit', 20, 'Monthly credit allocation – Business plan', 20),

  -- Mike: debit 1 credit for booking 2
  ('60000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000005',
   '50000000-0000-0000-0000-000000000002', 'debit', 1, 'Room booking – Cedar Pod (1 hr)', 19),

  -- Mike: monthly top-up (simulating renewal top-up mid-period)
  ('60000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000005',
   NULL, 'credit', 5, 'Bonus top-up – referral reward', 24),

  -- Mike: manually adjusted to match credits_remaining = 14
  ('60000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000005',
   NULL, 'debit', 10, 'Retroactive adjustment – over-allocation correction', 14),

  -- Fatima: initial 2 credits on trial
  ('60000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-000000000006',
   NULL, 'credit', 2, 'Trial credit allocation – Starter plan', 2),

  -- Fatima: debit 2 credits for upcoming booking 4 (pre-authorized)
  ('60000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000006',
   '50000000-0000-0000-0000-000000000004', 'debit', 2, 'Room booking – Cedar Pod (1.5 hrs)', 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. INVOICES
-- ============================================================
INSERT INTO public.invoices
  (id, client_id, stripe_invoice_id, amount_cents, currency, status, description, period_start, period_end)
VALUES
  -- Priya – last month's invoice (paid)
  ('70000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',
   'in_priya_202404',
   12900,
   'CAD',
   'paid',
   'Professional Plan – April 2026',
   NOW() - INTERVAL '45 days',
   NOW() - INTERVAL '15 days'),

  -- Mike – last month's invoice (paid)
  ('70000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000005',
   'in_mike_202404',
   24900,
   'CAD',
   'paid',
   'Business Plan – April 2026',
   NOW() - INTERVAL '50 days',
   NOW() - INTERVAL '20 days'),

  -- Fatima – first invoice (open – trial period)
  ('70000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000006',
   'in_fatima_202405',
   4900,
   'CAD',
   'open',
   'Starter Plan – May 2026',
   NOW() - INTERVAL '5 days',
   NOW() + INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. PAYMENT METHODS
-- ============================================================
INSERT INTO public.payment_methods
  (id, client_id, stripe_payment_method_id, brand, last4, exp_month, exp_year, is_default)
VALUES
  ('80000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',
   'pm_priya_visa_001',
   'visa',
   '4242',
   8,
   2027,
   true),

  ('80000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000005',
   'pm_mike_mc_001',
   'mastercard',
   '5555',
   3,
   2028,
   true),

  ('80000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000006',
   'pm_fatima_visa_001',
   'visa',
   '0002',
   11,
   2026,
   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. CRM PIPELINE + STAGES
-- ============================================================
INSERT INTO public.crm_pipelines (id, name, description, is_default)
VALUES
  ('90000000-0000-0000-0000-000000000001',
   'New Client Acquisition',
   'Standard pipeline for converting leads into active Markham Office Services clients.',
   true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.crm_pipeline_stages (id, pipeline_id, name, order_index, color)
VALUES
  ('91000000-0000-0000-0000-000000000001',
   '90000000-0000-0000-0000-000000000001',
   'New Lead',
   1,
   '#94a3b8'),

  ('91000000-0000-0000-0000-000000000002',
   '90000000-0000-0000-0000-000000000001',
   'Contacted',
   2,
   '#60a5fa'),

  ('91000000-0000-0000-0000-000000000003',
   '90000000-0000-0000-0000-000000000001',
   'Proposal Sent',
   3,
   '#f59e0b'),

  ('91000000-0000-0000-0000-000000000004',
   '90000000-0000-0000-0000-000000000001',
   'Negotiation',
   4,
   '#f97316'),

  ('91000000-0000-0000-0000-000000000005',
   '90000000-0000-0000-0000-000000000001',
   'Closed Won',
   5,
   '#22c55e'),

  ('91000000-0000-0000-0000-000000000006',
   '90000000-0000-0000-0000-000000000001',
   'Closed Lost',
   6,
   '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. CRM CONTACTS (10 realistic Canadian business contacts)
-- ============================================================
INSERT INTO public.crm_contacts
  (id, full_name, email, phone, company_name, website,
   address, city, province, postal_code, country,
   status, source, assigned_to, tags, notes, linked_user_id, created_by)
VALUES
  -- 1. Linked to Priya (existing client)
  ('a0000000-0000-0000-0000-000000000001',
   'Priya Sharma',
   'priya.sharma@horizontech.ca',
   '647-555-0201',
   'Horizon Tech Solutions Inc.',
   'https://horizontech.ca',
   '7030 Woodbine Ave, Suite 500',
   'Markham',
   'ON',
   'L3R 6G2',
   'Canada',
   'active',
   'referral',
   '00000000-0000-0000-0000-000000000002',   -- assigned to Sarah
   ARRAY['virtual-office', 'professional-plan', 'tech'],
   'Long-term client. Runs a SaaS startup. High growth potential.',
   '00000000-0000-0000-0000-000000000004',   -- linked to Priya user
   '00000000-0000-0000-0000-000000000001'),

  -- 2. Linked to Mike (existing client)
  ('a0000000-0000-0000-0000-000000000002',
   'Mike Chen',
   'mike.chen@goldendragon.ca',
   '416-555-0202',
   'Golden Dragon Import & Export Ltd.',
   'https://goldendragon.ca',
   '4261 Hwy 7, Unit 205',
   'Markham',
   'ON',
   'L3R 9W6',
   'Canada',
   'active',
   'walk_in',
   '00000000-0000-0000-0000-000000000003',   -- assigned to David
   ARRAY['virtual-office', 'business-plan', 'import-export', 'loan-prospect'],
   'Walk-in client. Interested in business loan. Regular boardroom user.',
   '00000000-0000-0000-0000-000000000005',   -- linked to Mike user
   '00000000-0000-0000-0000-000000000001'),

  -- 3. Linked to Fatima (existing client)
  ('a0000000-0000-0000-0000-000000000003',
   'Fatima Ali',
   'fatima.ali@novahealth.ca',
   '905-555-0203',
   'Nova Health Consulting',
   'https://novahealth.ca',
   '8 Warden Ave, Suite 100',
   'Scarborough',
   'ON',
   'M1W 3Y9',
   'Canada',
   'active',
   'website',
   '00000000-0000-0000-0000-000000000002',   -- assigned to Sarah
   ARRAY['virtual-office', 'starter-plan', 'healthcare'],
   'Trial client. Healthcare compliance consultant. May upgrade to Professional.',
   '00000000-0000-0000-0000-000000000006',   -- linked to Fatima user
   '00000000-0000-0000-0000-000000000001'),

  -- 4. Unlinked prospect
  ('a0000000-0000-0000-0000-000000000004',
   'James Kowalski',
   'james.k@kowalskilaw.ca',
   '905-555-0301',
   'Kowalski & Associates Law',
   NULL,
   '3200 Hwy 7 E, Suite 301',
   'Markham',
   'ON',
   'L3R 0E1',
   'Canada',
   'prospect',
   'referral',
   '00000000-0000-0000-0000-000000000002',   -- assigned to Sarah
   ARRAY['legal', 'professional-plan-prospect'],
   'Referred by Priya Sharma. Interested in virtual office + boardroom access for client meetings.',
   NULL,
   '00000000-0000-0000-0000-000000000002'),

  -- 5. Unlinked lead
  ('a0000000-0000-0000-0000-000000000005',
   'Anita Desai',
   'adesai@desaiaccounting.ca',
   '647-555-0302',
   'Desai Accounting Services',
   'https://desaiaccounting.ca',
   '9390 Markham Rd, Unit 12',
   'Markham',
   'ON',
   'L6E 0B6',
   'Canada',
   'lead',
   'website',
   '00000000-0000-0000-0000-000000000003',   -- assigned to David
   ARRAY['accounting', 'small-business'],
   'Filled in the website contact form. Looking for virtual office during tax season.',
   NULL,
   '00000000-0000-0000-0000-000000000003'),

  -- 6. Unlinked lead (cold outreach)
  ('a0000000-0000-0000-0000-000000000006',
   'Robert Tran',
   'rtran@tranrealtygroup.ca',
   '416-555-0303',
   'Tran Realty Group',
   'https://tranrealtygroup.ca',
   '4750 Yonge St, Suite 804',
   'North York',
   'ON',
   'M2N 0J6',
   'Canada',
   'lead',
   'cold_outreach',
   '00000000-0000-0000-0000-000000000003',   -- assigned to David
   ARRAY['real-estate', 'high-value'],
   'Cold LinkedIn outreach. Realtor seeking prestigious Markham address for listings.',
   NULL,
   '00000000-0000-0000-0000-000000000003'),

  -- 7. Churned former client
  ('a0000000-0000-0000-0000-000000000007',
   'Linda Park',
   'linda@parkbakeryco.ca',
   '905-555-0304',
   'Park Bakery Co.',
   NULL,
   '635 Ellesmere Rd',
   'Scarborough',
   'ON',
   'M1R 4B9',
   'Canada',
   'churned',
   'walk_in',
   '00000000-0000-0000-0000-000000000002',   -- assigned to Sarah
   ARRAY['food-service', 'churned-price'],
   'Left after 6 months. Stated price was too high. May return in Q3.',
   NULL,
   '00000000-0000-0000-0000-000000000001'),

  -- 8. Active prospect nearing close
  ('a0000000-0000-0000-0000-000000000008',
   'Samuel Okafor',
   's.okafor@tekbridge.ca',
   '416-555-0305',
   'TekBridge Consulting',
   'https://tekbridge.ca',
   '1 Commerce Valley Dr E',
   'Thornhill',
   'ON',
   'L3T 7X6',
   'Canada',
   'prospect',
   'referral',
   '00000000-0000-0000-0000-000000000002',   -- assigned to Sarah
   ARRAY['consulting', 'business-plan-prospect', 'high-value'],
   'Referred by David Wong. IT consulting firm. Wants Business plan. Proposal sent.',
   NULL,
   '00000000-0000-0000-0000-000000000002'),

  -- 9. Inactive former client
  ('a0000000-0000-0000-0000-000000000009',
   'Yuki Tanaka',
   'yuki@tanakaimports.ca',
   '905-555-0306',
   'Tanaka Imports LLC',
   NULL,
   '205 Consumers Rd, Suite 310',
   'North York',
   'ON',
   'M2J 4V8',
   'Canada',
   'inactive',
   'other',
   '00000000-0000-0000-0000-000000000003',   -- assigned to David
   ARRAY['import-export', 'seasonal'],
   'Business went on hiatus. Owner travelling. May resume services in fall.',
   NULL,
   '00000000-0000-0000-0000-000000000001'),

  -- 10. New lead from website
  ('a0000000-0000-0000-0000-000000000010',
   'Maria Santos',
   'msantos@santosevents.ca',
   '647-555-0307',
   'Santos Event Management',
   'https://santosevents.ca',
   '10 Milner Business Ct',
   'Scarborough',
   'ON',
   'M1B 3C6',
   'Canada',
   'lead',
   'website',
   NULL,   -- unassigned
   ARRAY['events', 'new-lead'],
   'New form submission. Event coordinator looking for flexible meeting space + address.',
   NULL,
   '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. CRM DEALS (3 active deals)
-- ============================================================
INSERT INTO public.crm_deals
  (id, contact_id, pipeline_id, stage_id, title, value, currency,
   status, expected_close_date, assigned_to, notes, created_by)
VALUES
  -- Deal 1: James Kowalski – Proposal Sent
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000004',
   '90000000-0000-0000-0000-000000000001',
   '91000000-0000-0000-0000-000000000003',   -- Proposal Sent
   'Professional Plan + Boardroom Access – Kowalski Law',
   1548.00,
   'CAD',
   'open',
   CURRENT_DATE + INTERVAL '14 days',
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   'Annual Professional plan ($129×12=$1,548). Proposal emailed. Awaiting partner review.',
   '00000000-0000-0000-0000-000000000002'),

  -- Deal 2: Samuel Okafor – Negotiation
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000008',
   '90000000-0000-0000-0000-000000000001',
   '91000000-0000-0000-0000-000000000004',   -- Negotiation
   'Business Plan – TekBridge Consulting',
   2988.00,
   'CAD',
   'open',
   CURRENT_DATE + INTERVAL '7 days',
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   'Annual Business plan ($249×12=$2,988). Client wants 10% discount. Escalated to admin.',
   '00000000-0000-0000-0000-000000000002'),

  -- Deal 3: Anita Desai – Contacted
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000005',
   '90000000-0000-0000-0000-000000000001',
   '91000000-0000-0000-0000-000000000002',   -- Contacted
   'Starter Plan – Desai Accounting',
   588.00,
   'CAD',
   'open',
   CURRENT_DATE + INTERVAL '21 days',
   '00000000-0000-0000-0000-000000000003',   -- David
   'Annual Starter plan ($49×12=$588). Follow-up call booked for next Tuesday.',
   '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. CRM ACTIVITIES
-- ============================================================
INSERT INTO public.crm_activities
  (id, contact_id, deal_id, type, subject, body, direction, occurred_at, created_by)
VALUES
  -- Activity on Kowalski deal
  ('c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000001',
   'email',
   'Virtual Office Proposal – Kowalski & Associates',
   'Hi James, as discussed, please find attached our Professional Plan proposal including boardroom access. We offer flexible terms and can arrange a walkthrough of our Markham facility at your convenience.',
   'outbound',
   NOW() - INTERVAL '3 days',
   '00000000-0000-0000-0000-000000000002'),

  ('c0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000001',
   'call',
   'Follow-up call – Proposal Review',
   'Spoke with James for 20 minutes. Partners are reviewing the proposal. He is positive but wants confirmation of available boardroom slots. Sending availability calendar link.',
   'outbound',
   NOW() - INTERVAL '1 day',
   '00000000-0000-0000-0000-000000000002'),

  -- Activity on TekBridge deal
  ('c0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000008',
   'b0000000-0000-0000-0000-000000000002',
   'meeting',
   'In-Person Office Tour – TekBridge',
   'Samuel toured our Markham facility. Very impressed with the boardroom and reception area. Wants 10% annual commitment discount. I recommended a 5% discount; escalating to Jackie for approval.',
   'inbound',
   NOW() - INTERVAL '5 days',
   '00000000-0000-0000-0000-000000000002'),

  ('c0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000008',
   'b0000000-0000-0000-0000-000000000002',
   'note',
   'Admin – Discount Approval Pending',
   'Jackie to review and approve/reject 7.5% compromise discount by EOD Friday.',
   NULL,
   NOW() - INTERVAL '2 days',
   '00000000-0000-0000-0000-000000000001'),

  -- Activity on Desai Accounting
  ('c0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000003',
   'email',
   'Introduction & Starter Plan Info',
   'Hi Anita, thank you for your interest in Markham Office Services! I have attached our Starter Plan overview. Our address is ideal for sole proprietors and small accounting firms. Happy to answer any questions.',
   'outbound',
   NOW() - INTERVAL '7 days',
   '00000000-0000-0000-0000-000000000003'),

  ('c0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000003',
   'call',
   'Discovery Call – Desai Accounting',
   'Anita is a CPA running her own practice. Needs virtual address for tax season (Jan–Apr). Interested in monthly plan, not annual. Follow-up call scheduled.',
   'inbound',
   NOW() - INTERVAL '4 days',
   '00000000-0000-0000-0000-000000000003'),

  -- System activity on Maria Santos (new lead)
  ('c0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000010',
   NULL,
   'system',
   'New Lead Created – Website Form Submission',
   'Contact auto-created from website inquiry form. Source: santosevents.ca contact page. Message: "Looking for a professional Markham address and event-friendly meeting rooms."',
   'inbound',
   NOW() - INTERVAL '1 day',
   '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. CRM TAGS
-- ============================================================
INSERT INTO public.crm_tags (id, name, color)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'virtual-office',         '#6366f1'),
  ('d0000000-0000-0000-0000-000000000002', 'professional-plan',      '#3b82f6'),
  ('d0000000-0000-0000-0000-000000000003', 'business-plan',          '#8b5cf6'),
  ('d0000000-0000-0000-0000-000000000004', 'starter-plan',           '#64748b'),
  ('d0000000-0000-0000-0000-000000000005', 'loan-prospect',          '#f59e0b'),
  ('d0000000-0000-0000-0000-000000000006', 'high-value',             '#22c55e'),
  ('d0000000-0000-0000-0000-000000000007', 'tech',                   '#06b6d4'),
  ('d0000000-0000-0000-0000-000000000008', 'healthcare',             '#ec4899'),
  ('d0000000-0000-0000-0000-000000000009', 'legal',                  '#f97316'),
  ('d0000000-0000-0000-0000-000000000010', 'accounting',             '#84cc16'),
  ('d0000000-0000-0000-0000-000000000011', 'real-estate',            '#14b8a6'),
  ('d0000000-0000-0000-0000-000000000012', 'import-export',          '#a78bfa'),
  ('d0000000-0000-0000-0000-000000000013', 'churned-price',          '#ef4444'),
  ('d0000000-0000-0000-0000-000000000014', 'new-lead',               '#94a3b8'),
  ('d0000000-0000-0000-0000-000000000015', 'seasonal',               '#fb923c')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. TASKS (5 representative tasks)
-- ============================================================
INSERT INTO public.tasks
  (id, title, description, client_id, assigned_to, created_by,
   service_category, priority, status, due_date)
VALUES
  -- Task 1: Complete Ontario business registration for Fatima
  ('e0000000-0000-0000-0000-000000000001',
   'File Ontario Business Registration – Nova Health Consulting',
   'Register Nova Health Consulting as a sole proprietorship with Service Ontario. Collect signed application form, proof of ID, and payment. Upload registration certificate to client portal once complete.',
   '00000000-0000-0000-0000-000000000006',   -- Fatima
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   '00000000-0000-0000-0000-000000000001',   -- Jackie (admin)
   'business_registration',
   'high',
   'completed',
   CURRENT_DATE - INTERVAL '20 days'),

  -- Task 2: Loan package prep for Mike Chen
  ('e0000000-0000-0000-0000-000000000002',
   'Prepare Loan Application Package – Golden Dragon Import & Export',
   'Collect last 3 years T2 corporate returns, NOA, bank statements (6 months), and business plan. Cross-reference with lender checklist. Submit to BDC and RBC Commercial.',
   '00000000-0000-0000-0000-000000000005',   -- Mike
   '00000000-0000-0000-0000-000000000003',   -- David
   '00000000-0000-0000-0000-000000000001',   -- Jackie
   'loan_assistance',
   'high',
   'awaiting_client',
   CURRENT_DATE + INTERVAL '10 days'),

  -- Task 3: Onboard Priya Sharma to virtual office
  ('e0000000-0000-0000-0000-000000000003',
   'Virtual Office Onboarding – Horizon Tech Solutions',
   'Set up mail receipt profile, configure call-forwarding rules, and provide client portal walkthrough. Send welcome package and address confirmation letter.',
   '00000000-0000-0000-0000-000000000004',   -- Priya
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   'virtual_office',
   'medium',
   'completed',
   CURRENT_DATE - INTERVAL '55 days'),

  -- Task 4: Follow up with TekBridge on deal
  ('e0000000-0000-0000-0000-000000000004',
   'Get Discount Approval & Close TekBridge Deal',
   'Present 7.5% discount counter-offer to Samuel Okafor. If accepted, generate subscription agreement and process first invoice. Deadline: before end of May.',
   NULL,   -- internal task (no client_id)
   '00000000-0000-0000-0000-000000000001',   -- Jackie
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   'general',
   'urgent',
   'in_progress',
   CURRENT_DATE + INTERVAL '7 days'),

  -- Task 5: Renew mail forwarding setup for Mike Chen
  ('e0000000-0000-0000-0000-000000000005',
   'Update Mail Forwarding Address – Golden Dragon',
   'Mike requested mail to be forwarded to a new warehouse address in Scarborough. Update the mail profile and confirm with courier account. Notify Mike by email once done.',
   '00000000-0000-0000-0000-000000000005',   -- Mike
   '00000000-0000-0000-0000-000000000003',   -- David
   '00000000-0000-0000-0000-000000000003',   -- David
   'virtual_office',
   'medium',
   'open',
   CURRENT_DATE + INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. TASK COMMENTS
-- ============================================================
INSERT INTO public.task_comments (id, task_id, author_id, body)
VALUES
  -- Comments on Task 2 (Loan package – awaiting client)
  ('f0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',   -- David
   'Reached out to Mike via email and phone. He says the 2023 T2 return is with his accountant and should be ready by next Friday. Following up then.'),

  ('f0000000-0000-0000-0000-000000000002',
   'e0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000005',   -- Mike (client)
   'Hi David, my accountant confirmed the T2 will be ready by May 30th. I will send you the PDF as soon as I receive it. Thank you for your patience.'),

  -- Comments on Task 4 (TekBridge discount)
  ('f0000000-0000-0000-0000-000000000003',
   'e0000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000002',   -- Sarah
   'Samuel is very keen to close this month. I recommend approving 7.5% – we still make $2,762 annually which is above our break-even for a Business plan client.'),

  ('f0000000-0000-0000-0000-000000000004',
   'e0000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',   -- Jackie (admin)
   'Approved. 7.5% discount on annual Business plan = $2,763/yr. Sarah please send the updated proposal and DocuSign agreement by end of day.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================
INSERT INTO public.notifications
  (id, user_id, type, title, message, is_read, action_url)
VALUES
  -- Priya's notifications
  ('f1000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004',
   'booking_confirmed',
   'Room Booking Confirmed',
   'Your booking for the Maple Suite on ' || TO_CHAR(NOW() + INTERVAL '1 day', 'Mon DD, YYYY') || ' at 9:00 AM has been confirmed.',
   false,
   '/bookings/50000000-0000-0000-0000-000000000003'),

  ('f1000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000004',
   'invoice_paid',
   'Invoice Paid – April 2026',
   'Your invoice for the Professional Plan (April 2026) of $129.00 CAD has been successfully processed.',
   true,
   '/invoices/70000000-0000-0000-0000-000000000001'),

  -- Mike's notifications
  ('f1000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000005',
   'task_awaiting_client',
   'Action Required: Loan Application Documents',
   'Your loan application package is on hold. Please upload your 2023 T2 corporate return and 6 months of bank statements to proceed.',
   false,
   '/tasks/e0000000-0000-0000-0000-000000000002'),

  -- Fatima's notifications
  ('f1000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000006',
   'service_completed',
   'Business Registration Complete',
   'Your Ontario Business Registration for Nova Health Consulting has been completed. Your certificate is available in the portal.',
   false,
   '/services/31000000-0000-0000-0000-000000000005'),

  ('f1000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000006',
   'booking_confirmed',
   'Room Booking Confirmed',
   'Your booking for the Cedar Pod on ' || TO_CHAR(NOW() + INTERVAL '2 days', 'Mon DD, YYYY') || ' at 1:00 PM has been confirmed.',
   false,
   '/bookings/50000000-0000-0000-0000-000000000004'),

  -- Sarah's internal notifications
  ('f1000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000002',
   'deal_update',
   'Discount Approved – TekBridge Deal',
   'Jackie has approved the 7.5% discount for TekBridge Consulting. Please send the updated proposal and DocuSign agreement.',
   false,
   '/crm/deals/b0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 19. NOTIFICATION PREFERENCES (defaults for all users)
-- ============================================================
INSERT INTO public.notification_preferences
  (user_id, event_type, email_enabled, sms_enabled, in_app_enabled)
VALUES
  -- Admin
  ('00000000-0000-0000-0000-000000000001', 'new_lead',           true,  false, true),
  ('00000000-0000-0000-0000-000000000001', 'deal_won',           true,  true,  true),
  ('00000000-0000-0000-0000-000000000001', 'invoice_overdue',    true,  false, true),
  ('00000000-0000-0000-0000-000000000001', 'task_assigned',      true,  false, true),
  -- Sarah (staff)
  ('00000000-0000-0000-0000-000000000002', 'task_assigned',      true,  false, true),
  ('00000000-0000-0000-0000-000000000002', 'deal_update',        true,  false, true),
  ('00000000-0000-0000-0000-000000000002', 'booking_confirmed',  false, false, true),
  -- David (staff)
  ('00000000-0000-0000-0000-000000000003', 'task_assigned',      true,  false, true),
  ('00000000-0000-0000-0000-000000000003', 'deal_update',        true,  false, true),
  -- Priya (client)
  ('00000000-0000-0000-0000-000000000004', 'booking_confirmed',  true,  true,  true),
  ('00000000-0000-0000-0000-000000000004', 'invoice_paid',       true,  false, true),
  ('00000000-0000-0000-0000-000000000004', 'service_completed',  true,  false, true),
  -- Mike (client)
  ('00000000-0000-0000-0000-000000000005', 'booking_confirmed',  true,  true,  true),
  ('00000000-0000-0000-0000-000000000005', 'task_awaiting_client', true, true, true),
  ('00000000-0000-0000-0000-000000000005', 'invoice_paid',       true,  false, true),
  -- Fatima (client)
  ('00000000-0000-0000-0000-000000000006', 'booking_confirmed',  true,  false, true),
  ('00000000-0000-0000-0000-000000000006', 'service_completed',  true,  true,  true),
  ('00000000-0000-0000-0000-000000000006', 'invoice_paid',       true,  false, true)
ON CONFLICT (user_id, event_type) DO NOTHING;
