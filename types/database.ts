// ============================================================
// Markham Office Services – Database Type Definitions
// types/database.ts
//
// Generated from supabase/migrations/001_schema.sql
// Use these types with the Supabase JS client:
//   import { createClient } from '@supabase/supabase-js'
//   import { Database } from '@/types/database'
//   const supabase = createClient<Database>(url, key)
// ============================================================

// ============================================================
// ENUM / UNION TYPES
// ============================================================

export type UserRole = 'admin' | 'staff' | 'client'

export type ContactStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned'

export type ContactSource = 'referral' | 'website' | 'cold_outreach' | 'walk_in' | 'other'

export type DealStatus = 'open' | 'won' | 'lost'

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'sms' | 'system'

export type ActivityDirection = 'inbound' | 'outbound'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing'

export type InvoiceStatus = 'paid' | 'open' | 'void' | 'uncollectible'

export type ServiceCategory = 'virtual_office' | 'loan_assistance' | 'business_registration'

export type ClientServiceStatus = 'active' | 'pending' | 'completed' | 'expired'

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed'

export type LedgerEntryType = 'credit' | 'debit'

export type TaskServiceCategory =
  | 'virtual_office'
  | 'loan_assistance'
  | 'business_registration'
  | 'room'
  | 'general'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'awaiting_client'
  | 'completed'
  | 'cancelled'

// ============================================================
// ROW TYPES  (match exactly what Supabase returns)
// ============================================================

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  company_name: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface CrmContact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  website: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string | null
  status: ContactStatus
  source: ContactSource
  assigned_to: string | null
  tags: string[]
  notes: string | null
  linked_user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CrmPipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean | null
  created_at: string
}

export interface CrmPipelineStage {
  id: string
  pipeline_id: string
  name: string
  order_index: number
  color: string | null
  created_at: string
}

export interface CrmDeal {
  id: string
  contact_id: string
  pipeline_id: string
  stage_id: string
  title: string
  value: number | null
  currency: string | null
  status: DealStatus
  expected_close_date: string | null
  assigned_to: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CrmActivity {
  id: string
  contact_id: string
  deal_id: string | null
  type: ActivityType
  subject: string
  body: string | null
  direction: ActivityDirection | null
  occurred_at: string
  created_by: string | null
  created_at: string
}

export interface CrmTag {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface Plan {
  id: string
  name: string
  description: string | null
  price_monthly: number
  stripe_price_id: string | null
  meeting_room_credits_per_month: number | null
  features: unknown[] | null
  is_active: boolean | null
  created_at: string
}

export interface ClientSubscription {
  id: string
  client_id: string
  plan_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  credits_remaining: number | null
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  client_id: string
  stripe_payment_method_id: string
  brand: string | null
  last4: string | null
  exp_month: number | null
  exp_year: number | null
  is_default: boolean | null
  created_at: string
}

export interface Invoice {
  id: string
  client_id: string
  stripe_invoice_id: string | null
  amount_cents: number
  currency: string | null
  status: InvoiceStatus
  description: string | null
  invoice_pdf_url: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
}

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  description: string | null
  price_cents: number | null
  is_active: boolean | null
  created_at: string
}

export interface ClientService {
  id: string
  client_id: string
  service_id: string
  status: ClientServiceStatus
  start_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
}

export interface MeetingRoom {
  id: string
  name: string
  description: string | null
  capacity: number | null
  credits_per_hour: number | null
  amenities: unknown[] | null
  images: unknown[] | null
  is_active: boolean | null
  created_at: string
}

export interface RoomBooking {
  id: string
  client_id: string
  room_id: string
  start_time: string
  end_time: string
  duration_hours: number
  credits_used: number
  status: BookingStatus
  notes: string | null
  cancelled_at: string | null
  created_at: string
}

export interface CreditLedgerEntry {
  id: string
  client_id: string
  booking_id: string | null
  type: LedgerEntryType
  amount: number
  reason: string
  balance_after: number
  performed_by: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  client_id: string | null
  assigned_to: string | null
  created_by: string | null
  service_category: TaskServiceCategory | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  body: string
  attachments: unknown[] | null
  created_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  uploaded_by: string
  file_url: string
  file_name: string
  file_size: number | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean | null
  action_url: string | null
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  event_type: string
  email_enabled: boolean | null
  sms_enabled: boolean | null
  in_app_enabled: boolean | null
}

// ============================================================
// INSERT TYPES  (all fields that have DB defaults are optional)
// ============================================================

export interface UserInsert {
  id: string                           // must match auth.users(id)
  email: string
  full_name: string
  phone?: string | null
  company_name?: string | null
  role?: UserRole
  avatar_url?: string | null
  is_active?: boolean
  invited_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface CrmContactInsert {
  id?: string
  full_name: string
  email?: string | null
  phone?: string | null
  company_name?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country?: string | null
  status?: ContactStatus
  source?: ContactSource
  assigned_to?: string | null
  tags?: string[]
  notes?: string | null
  linked_user_id?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface CrmPipelineInsert {
  id?: string
  name: string
  description?: string | null
  is_default?: boolean | null
  created_at?: string
}

export interface CrmPipelineStageInsert {
  id?: string
  pipeline_id: string
  name: string
  order_index: number
  color?: string | null
  created_at?: string
}

export interface CrmDealInsert {
  id?: string
  contact_id: string
  pipeline_id: string
  stage_id: string
  title: string
  value?: number | null
  currency?: string | null
  status?: DealStatus
  expected_close_date?: string | null
  assigned_to?: string | null
  notes?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface CrmActivityInsert {
  id?: string
  contact_id: string
  deal_id?: string | null
  type: ActivityType
  subject: string
  body?: string | null
  direction?: ActivityDirection | null
  occurred_at?: string
  created_by?: string | null
  created_at?: string
}

export interface CrmTagInsert {
  id?: string
  name: string
  color?: string | null
  created_at?: string
}

export interface PlanInsert {
  id?: string
  name: string
  description?: string | null
  price_monthly: number
  stripe_price_id?: string | null
  meeting_room_credits_per_month?: number | null
  features?: unknown[] | null
  is_active?: boolean | null
  created_at?: string
}

export interface ClientSubscriptionInsert {
  id?: string
  client_id: string
  plan_id: string
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  status?: SubscriptionStatus
  current_period_start?: string | null
  current_period_end?: string | null
  credits_remaining?: number | null
  created_at?: string
  updated_at?: string
}

export interface PaymentMethodInsert {
  id?: string
  client_id: string
  stripe_payment_method_id: string
  brand?: string | null
  last4?: string | null
  exp_month?: number | null
  exp_year?: number | null
  is_default?: boolean | null
  created_at?: string
}

export interface InvoiceInsert {
  id?: string
  client_id: string
  stripe_invoice_id?: string | null
  amount_cents: number
  currency?: string | null
  status?: InvoiceStatus
  description?: string | null
  invoice_pdf_url?: string | null
  period_start?: string | null
  period_end?: string | null
  created_at?: string
}

export interface ServiceInsert {
  id?: string
  name: string
  category: ServiceCategory
  description?: string | null
  price_cents?: number | null
  is_active?: boolean | null
  created_at?: string
}

export interface ClientServiceInsert {
  id?: string
  client_id: string
  service_id: string
  status?: ClientServiceStatus
  start_date?: string | null
  expiry_date?: string | null
  notes?: string | null
  created_at?: string
}

export interface MeetingRoomInsert {
  id?: string
  name: string
  description?: string | null
  capacity?: number | null
  credits_per_hour?: number | null
  amenities?: unknown[] | null
  images?: unknown[] | null
  is_active?: boolean | null
  created_at?: string
}

export interface RoomBookingInsert {
  id?: string
  client_id: string
  room_id: string
  start_time: string
  end_time: string
  duration_hours: number
  credits_used: number
  status?: BookingStatus
  notes?: string | null
  cancelled_at?: string | null
  created_at?: string
}

export interface CreditLedgerEntryInsert {
  id?: string
  client_id: string
  booking_id?: string | null
  type: LedgerEntryType
  amount: number
  reason: string
  balance_after: number
  performed_by?: string | null
  created_at?: string
}

export interface TaskInsert {
  id?: string
  title: string
  description?: string | null
  client_id?: string | null
  assigned_to?: string | null
  created_by?: string | null
  service_category?: TaskServiceCategory | null
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface TaskCommentInsert {
  id?: string
  task_id: string
  author_id: string
  body: string
  attachments?: unknown[] | null
  created_at?: string
}

export interface TaskAttachmentInsert {
  id?: string
  task_id: string
  uploaded_by: string
  file_url: string
  file_name: string
  file_size?: number | null
  created_at?: string
}

export interface NotificationInsert {
  id?: string
  user_id: string
  type: string
  title: string
  message: string
  is_read?: boolean | null
  action_url?: string | null
  created_at?: string
}

export interface NotificationPreferenceInsert {
  id?: string
  user_id: string
  event_type: string
  email_enabled?: boolean | null
  sms_enabled?: boolean | null
  in_app_enabled?: boolean | null
}

// ============================================================
// UPDATE TYPES  (all fields optional — only send what changes)
// ============================================================

export type UserUpdate = Partial<Omit<UserInsert, 'id'>>
export type CrmContactUpdate = Partial<Omit<CrmContactInsert, 'id'>>
export type CrmPipelineUpdate = Partial<Omit<CrmPipelineInsert, 'id'>>
export type CrmPipelineStageUpdate = Partial<Omit<CrmPipelineStageInsert, 'id'>>
export type CrmDealUpdate = Partial<Omit<CrmDealInsert, 'id'>>
export type CrmActivityUpdate = Partial<Omit<CrmActivityInsert, 'id'>>
export type CrmTagUpdate = Partial<Omit<CrmTagInsert, 'id'>>
export type PlanUpdate = Partial<Omit<PlanInsert, 'id'>>
export type ClientSubscriptionUpdate = Partial<Omit<ClientSubscriptionInsert, 'id'>>
export type PaymentMethodUpdate = Partial<Omit<PaymentMethodInsert, 'id'>>
export type InvoiceUpdate = Partial<Omit<InvoiceInsert, 'id'>>
export type ServiceUpdate = Partial<Omit<ServiceInsert, 'id'>>
export type ClientServiceUpdate = Partial<Omit<ClientServiceInsert, 'id'>>
export type MeetingRoomUpdate = Partial<Omit<MeetingRoomInsert, 'id'>>
export type RoomBookingUpdate = Partial<Omit<RoomBookingInsert, 'id'>>
export type TaskUpdate = Partial<Omit<TaskInsert, 'id'>>
export type TaskCommentUpdate = Partial<Omit<TaskCommentInsert, 'id'>>
export type TaskAttachmentUpdate = Partial<Omit<TaskAttachmentInsert, 'id'>>
export type NotificationUpdate = Partial<Omit<NotificationInsert, 'id'>>
export type NotificationPreferenceUpdate = Partial<Omit<NotificationPreferenceInsert, 'id'>>

// ============================================================
// RELATIONSHIP / JOINED TYPES  (common query patterns)
// ============================================================

/** CRM contact with resolved assigned-to and created-by user names */
export interface CrmContactWithUsers extends CrmContact {
  assigned_user: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
  created_by_user: Pick<User, 'id' | 'full_name'> | null
  linked_user: Pick<User, 'id' | 'full_name' | 'email'> | null
}

/** CRM deal with stage, contact, and assignee */
export interface CrmDealWithRelations extends CrmDeal {
  contact: Pick<CrmContact, 'id' | 'full_name' | 'company_name' | 'email'>
  stage: Pick<CrmPipelineStage, 'id' | 'name' | 'color' | 'order_index'>
  assigned_user: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
}

/** CRM pipeline with its stages sorted by order_index */
export interface CrmPipelineWithStages extends CrmPipeline {
  stages: CrmPipelineStage[]
}

/** Task with nested client, assignee, and creator */
export interface TaskWithUsers extends Task {
  client: Pick<User, 'id' | 'full_name' | 'email' | 'company_name'> | null
  assignee: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
  creator: Pick<User, 'id' | 'full_name'> | null
}

/** Task with comments and attachments (detail view) */
export interface TaskDetail extends TaskWithUsers {
  comments: (TaskComment & {
    author: Pick<User, 'id' | 'full_name' | 'avatar_url'>
  })[]
  attachments: (TaskAttachment & {
    uploader: Pick<User, 'id' | 'full_name'>
  })[]
}

/** Room booking with room and client details */
export interface RoomBookingWithDetails extends RoomBooking {
  room: Pick<MeetingRoom, 'id' | 'name' | 'capacity' | 'credits_per_hour'>
  client: Pick<User, 'id' | 'full_name' | 'email' | 'company_name'>
}

/** Client subscription with plan details */
export interface ClientSubscriptionWithPlan extends ClientSubscription {
  plan: Plan
}

/** Client with their active subscription and remaining credits */
export interface ClientWithSubscription extends User {
  subscription: ClientSubscriptionWithPlan | null
}

/** Invoice with client name */
export interface InvoiceWithClient extends Invoice {
  client: Pick<User, 'id' | 'full_name' | 'email' | 'company_name'>
}

/** Client service with service metadata */
export interface ClientServiceWithService extends ClientService {
  service: Service
}

// ============================================================
// DATABASE TYPE  (for Supabase client generic parameter)
// ============================================================

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      crm_contacts: {
        Row: CrmContact
        Insert: CrmContactInsert
        Update: CrmContactUpdate
      }
      crm_pipelines: {
        Row: CrmPipeline
        Insert: CrmPipelineInsert
        Update: CrmPipelineUpdate
      }
      crm_pipeline_stages: {
        Row: CrmPipelineStage
        Insert: CrmPipelineStageInsert
        Update: CrmPipelineStageUpdate
      }
      crm_deals: {
        Row: CrmDeal
        Insert: CrmDealInsert
        Update: CrmDealUpdate
      }
      crm_activities: {
        Row: CrmActivity
        Insert: CrmActivityInsert
        Update: CrmActivityUpdate
      }
      crm_tags: {
        Row: CrmTag
        Insert: CrmTagInsert
        Update: CrmTagUpdate
      }
      plans: {
        Row: Plan
        Insert: PlanInsert
        Update: PlanUpdate
      }
      client_subscriptions: {
        Row: ClientSubscription
        Insert: ClientSubscriptionInsert
        Update: ClientSubscriptionUpdate
      }
      payment_methods: {
        Row: PaymentMethod
        Insert: PaymentMethodInsert
        Update: PaymentMethodUpdate
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: InvoiceUpdate
      }
      services: {
        Row: Service
        Insert: ServiceInsert
        Update: ServiceUpdate
      }
      client_services: {
        Row: ClientService
        Insert: ClientServiceInsert
        Update: ClientServiceUpdate
      }
      meeting_rooms: {
        Row: MeetingRoom
        Insert: MeetingRoomInsert
        Update: MeetingRoomUpdate
      }
      room_bookings: {
        Row: RoomBooking
        Insert: RoomBookingInsert
        Update: RoomBookingUpdate
      }
      credit_ledger: {
        Row: CreditLedgerEntry
        Insert: CreditLedgerEntryInsert
        Update: never           // ledger is append-only; no updates allowed
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
      task_comments: {
        Row: TaskComment
        Insert: TaskCommentInsert
        Update: TaskCommentUpdate
      }
      task_attachments: {
        Row: TaskAttachment
        Insert: TaskAttachmentInsert
        Update: TaskAttachmentUpdate
      }
      notifications: {
        Row: Notification
        Insert: NotificationInsert
        Update: NotificationUpdate
      }
      notification_preferences: {
        Row: NotificationPreference
        Insert: NotificationPreferenceInsert
        Update: NotificationPreferenceUpdate
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      update_updated_at: {
        Args: Record<string, never>
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}

// ============================================================
// CONVENIENCE RE-EXPORTS  (shorthand for common table rows)
// ============================================================

// These match the Supabase generated client convention
// e.g. Tables<'users'> === User
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
