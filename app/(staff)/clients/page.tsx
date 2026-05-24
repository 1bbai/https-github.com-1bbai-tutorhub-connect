import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { Building2, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import type { ClientWithSubscription } from '@/types/database'

export const metadata = { title: 'Clients – Staff Portal' }

export default async function StaffClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone, company_name, role, avatar_url, is_active, invited_by, created_at, updated_at,
      subscription:client_subscriptions(
        id, client_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, credits_remaining, created_at, updated_at,
        plan:plans(id, name, price_monthly, is_active)
      )
    `)
    .eq('role', 'client')
    .eq('is_active', true)
    .order('full_name')

  const normalized = (clients ?? []).map((c) => ({
    ...c,
    subscription: Array.isArray(c.subscription) ? (c.subscription[0] ?? null) : c.subscription,
  })) as ClientWithSubscription[]

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${normalized.length} active client${normalized.length !== 1 ? 's' : ''}`}
      />

      {normalized.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Clients will appear here once they are added."
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalized.map((client) => {
                const initials = client.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <TableRow key={client.id} className="hover:bg-accent/50">
                    <TableCell>
                      <Link href={`/staff/clients/${client.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{client.full_name}</p>
                          {client.company_name && (
                            <p className="text-xs text-muted-foreground truncate">{client.company_name}</p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[160px]">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.subscription?.plan ? (
                        <div>
                          <p className="text-sm font-medium">{client.subscription.plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${client.subscription.plan.price_monthly}/mo
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.subscription?.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-xs'
                            : client.subscription?.status === 'past_due'
                            ? 'bg-red-100 text-red-700 border-red-200 text-xs'
                            : 'bg-muted text-muted-foreground text-xs'
                        }
                      >
                        {client.subscription?.status ?? 'No plan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(client.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
