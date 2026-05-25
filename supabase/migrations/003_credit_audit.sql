-- Track which admin performed each credit ledger entry
ALTER TABLE public.credit_ledger
  ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
