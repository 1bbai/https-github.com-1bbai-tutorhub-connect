'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CreditLedgerEntry } from '@/types/database'

interface UseCreditsReturn {
  balance: number
  history: CreditLedgerEntry[]
  loading: boolean
  refresh: () => void
}

export function useCredits(clientId: string): UseCreditsReturn {
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<CreditLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchCredits = useCallback(async () => {
    if (!clientId) return

    setLoading(true)
    try {
      // Fetch current balance from client_subscriptions
      const { data: sub } = await supabase
        .from('client_subscriptions')
        .select('credits_remaining')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle()

      setBalance(sub?.credits_remaining ?? 0)

      // Fetch credit ledger history
      const { data: ledger } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50)

      setHistory((ledger ?? []) as CreditLedgerEntry[])
    } catch (err) {
      console.error('[useCredits] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [clientId, supabase])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  // Set up Realtime for credit ledger changes
  useEffect(() => {
    if (!clientId) return

    const channel = supabase
      .channel(`credits:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_ledger',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const newEntry = payload.new as CreditLedgerEntry
          setHistory((prev) => [newEntry, ...prev])
          setBalance(newEntry.balance_after)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  return { balance, history, loading, refresh: fetchCredits }
}
