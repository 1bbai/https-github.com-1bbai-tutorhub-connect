'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface ClientsByPlan {
  plan: string
  count: number
}

export interface RoomBookingsByMonth {
  month: string
  bookings: number
}

export interface TaskCompletionByCategory {
  category: string
  completed: number
  total: number
}

export interface CrmFunnelEntry {
  status: string
  count: number
}

export interface ReportsChartsProps {
  monthlyRevenue: MonthlyRevenue[]
  clientsByPlan: ClientsByPlan[]
  roomBookingsByMonth: RoomBookingsByMonth[]
  taskCompletion: TaskCompletionByCategory[]
  crmFunnel: CrmFunnelEntry[]
}

// ─────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────

const COLORS = ['#3b82f6', '#0d9488', '#8b5cf6', '#f97316', '#10b981', '#f43f5e', '#64748b']

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────

function formatDollar(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value}`
}

// ─────────────────────────────────────────────
// ReportsCharts
// ─────────────────────────────────────────────

export function ReportsCharts({
  monthlyRevenue,
  clientsByPlan,
  roomBookingsByMonth,
  taskCompletion,
  crmFunnel,
}: ReportsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Monthly Revenue */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Paid invoices over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tickFormatter={formatDollar}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value)
                }
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="revenue" fill={COLORS[0]} radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Clients by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Active Clients by Plan</CardTitle>
          <CardDescription>Distribution of clients across subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={clientsByPlan}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="count"
                nameKey="plan"
                label={({ plan, percent }) =>
                  `${plan}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {clientsByPlan.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Room Bookings per Month */}
      <Card>
        <CardHeader>
          <CardTitle>Room Bookings</CardTitle>
          <CardDescription>Meeting room bookings over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={roomBookingsByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke={COLORS[1]}
                strokeWidth={2}
                dot={{ r: 4, fill: COLORS[1] }}
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Task Completion by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Rate</CardTitle>
          <CardDescription>Completed vs total tasks by service category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={taskCompletion}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="completed" fill={COLORS[4]} name="Completed" radius={[0, 4, 4, 0]} />
              <Bar dataKey="total" fill={COLORS[6]} name="Total" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 5. CRM Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>CRM Funnel</CardTitle>
          <CardDescription>Contacts at each stage of the sales funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={crmFunnel}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={65}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Contacts" radius={[0, 4, 4, 0]}>
                {crmFunnel.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
