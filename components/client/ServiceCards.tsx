'use client'

import * as React from 'react'
import { Building2, DollarSign, FileText, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ClientServiceWithService, ServiceCategory } from '@/types/database'

interface ServiceCardsProps {
  clientServices: ClientServiceWithService[]
}

const categoryIcon: Record<ServiceCategory, React.ElementType> = {
  virtual_office: Building2,
  loan_assistance: DollarSign,
  business_registration: FileText,
}

const categoryLabel: Record<ServiceCategory, string> = {
  virtual_office: 'Virtual Office',
  loan_assistance: 'Loan Assistance',
  business_registration: 'Business Registration',
}

const statusStyle: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: 'Expired', className: 'bg-red-100 text-red-700 border-red-200' },
}

export function ServiceCards({ clientServices }: ServiceCardsProps) {
  if (clientServices.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">My Services</h2>
        <EmptyState
          icon={Wrench}
          title="No active services"
          description="You don't have any services yet. Contact us at info@markhamoffice.com to get started."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">My Services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientServices.map((cs) => {
          const Icon = categoryIcon[cs.service.category] ?? Wrench
          const status = statusStyle[cs.status]
          const label = categoryLabel[cs.service.category] ?? cs.service.category.replace(/_/g, ' ')

          return (
            <Card key={cs.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate leading-tight">
                        {cs.service.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  </div>
                  {status && (
                    <span
                      className={cn(
                        'shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  )}
                </div>

                {cs.service.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {cs.service.description}
                  </p>
                )}

                <div className="space-y-1 text-xs text-muted-foreground">
                  {cs.start_date && (
                    <div className="flex justify-between">
                      <span>Start Date</span>
                      <span className="text-foreground font-medium">{formatDate(cs.start_date)}</span>
                    </div>
                  )}
                  {cs.expiry_date && (
                    <div className="flex justify-between">
                      <span>Expiry Date</span>
                      <span className={cn('font-medium', cs.status === 'expired' ? 'text-destructive' : 'text-foreground')}>
                        {formatDate(cs.expiry_date)}
                      </span>
                    </div>
                  )}
                </div>

                {cs.notes && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Staff Notes</p>
                    <p className="text-xs text-foreground leading-relaxed">{cs.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
