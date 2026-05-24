'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  CreditCard,
  Wifi,
  Monitor,
  Presentation,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Clock,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import type { MeetingRoom } from '@/types/database'

interface BookingWithRoom {
  id: string
  room_id: string
  start_time: string
  end_time: string
  duration_hours: number
  credits_used: number
  status: string
  notes: string | null
  cancelled_at: string | null
  created_at: string
  room: {
    id: string
    name: string
    capacity: number | null
    credits_per_hour: number | null
  } | null
}

interface RoomBrowserProps {
  rooms: MeetingRoom[]
  upcomingBookings: BookingWithRoom[]
  pastBookings: BookingWithRoom[]
  creditBalance: number
  clientId: string
}

const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => {
  const hour = 8 + i
  const label = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`
  return { hour, label }
})

const DURATIONS = [1, 2, 3, 4]

function amenityIcon(amenity: string): React.ElementType {
  const lower = amenity.toLowerCase()
  if (lower.includes('wifi') || lower.includes('wi-fi')) return Wifi
  if (lower.includes('tv') || lower.includes('display') || lower.includes('monitor')) return Monitor
  if (lower.includes('whiteboard') || lower.includes('projector') || lower.includes('presentation')) return Presentation
  return CheckCircle2
}

// ─── Booking Sheet ─────────────────────────────────────────────────────────────

function BookingSheet({
  room,
  creditBalance,
  open,
  onOpenChange,
  onBooked,
}: {
  room: MeetingRoom
  creditBalance: number
  open: boolean
  onOpenChange: (v: boolean) => void
  onBooked: () => void
}) {
  const [step, setStep] = React.useState(1)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [selectedHour, setSelectedHour] = React.useState<number | null>(null)
  const [selectedDuration, setSelectedDuration] = React.useState<number>(1)
  const [notes, setNotes] = React.useState('')
  const [bookedSlots, setBookedSlots] = React.useState<{ start: string; end: string }[]>([])
  const [loadingSlots, setLoadingSlots] = React.useState(false)
  const [booking, setBooking] = React.useState(false)

  const creditsPerHour = room.credits_per_hour ?? 1
  const creditsRequired = selectedDuration * creditsPerHour
  const creditsAfter = creditBalance - creditsRequired
  const insufficient = creditsAfter < 0

  React.useEffect(() => {
    if (!open) {
      setStep(1)
      setSelectedDate(undefined)
      setSelectedHour(null)
      setSelectedDuration(1)
      setNotes('')
      setBookedSlots([])
    }
  }, [open])

  React.useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    fetch(`/api/bookings/availability?roomId=${room.id}&date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setBookedSlots(data.bookedSlots ?? []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, room.id])

  function isSlotAvailable(hour: number): boolean {
    if (!selectedDate) return false
    const startISO = new Date(selectedDate)
    startISO.setHours(hour, 0, 0, 0)
    const endISO = new Date(startISO)
    endISO.setHours(hour + selectedDuration, 0, 0, 0)

    for (const slot of bookedSlots) {
      const bStart = parseISO(slot.start)
      const bEnd = parseISO(slot.end)
      if (startISO < bEnd && endISO > bStart) return false
    }
    // Don't allow booking past the last time slot (7PM = 19:00)
    if (hour + selectedDuration > 19) return false
    return true
  }

  async function handleConfirmBooking() {
    if (!selectedDate || selectedHour === null) return
    setBooking(true)

    const startTime = new Date(selectedDate)
    startTime.setHours(selectedHour, 0, 0, 0)
    const endTime = new Date(startTime)
    endTime.setHours(selectedHour + selectedDuration, 0, 0, 0)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationHours: selectedDuration,
          creditsUsed: creditsRequired,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create booking')
      }

      toast.success('Room booked successfully!')
      onOpenChange(false)
      onBooked()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create booking')
    } finally {
      setBooking(false)
    }
  }

  const startLabel = selectedHour !== null ? TIME_SLOTS.find((s) => s.hour === selectedHour)?.label : null
  const endHour = selectedHour !== null ? selectedHour + selectedDuration : null
  const endLabel = endHour !== null ? TIME_SLOTS.find((s) => s.hour === endHour)?.label ?? `${endHour > 12 ? endHour - 12 : endHour}:00 ${endHour >= 12 ? 'PM' : 'AM'}` : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Book {room.name}</SheetTitle>
        </SheetHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={cn('flex-1 h-0.5 rounded-full', step > s ? 'bg-emerald-500' : 'bg-muted')} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Date */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Select a Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
              className="rounded-md border"
            />
            <Button
              className="w-full"
              disabled={!selectedDate}
              onClick={() => setStep(2)}
            >
              Next: Select Time
            </Button>
          </div>
        )}

        {/* Step 2: Select Time & Duration */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold mb-1">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Date'}
              </h3>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Duration</p>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDuration(d)
                      setSelectedHour(null)
                    }}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                      selectedDuration === d
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {d}hr
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Start Time</p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking availability...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.filter((s) => s.hour + selectedDuration <= 19).map(({ hour, label }) => {
                    const available = isSlotAvailable(hour)
                    return (
                      <button
                        key={hour}
                        disabled={!available}
                        onClick={() => setSelectedHour(hour)}
                        className={cn(
                          'py-2 px-3 rounded-lg border text-xs font-medium transition-colors',
                          !available
                            ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-muted'
                            : selectedHour === hour
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedHour !== null && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {startLabel} – {endLabel}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Credits required: <strong>{creditsRequired}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={selectedHour === null}
                onClick={() => setStep(3)}
              >
                Next: Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedDate && selectedHour !== null && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold">Confirm Booking</h3>

            <Card>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium">{room.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{startLabel} – {endLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{selectedDuration} hour{selectedDuration !== 1 ? 's' : ''}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits to use</span>
                  <span className="font-semibold text-primary">{creditsRequired}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current balance</span>
                  <span className="font-medium">{creditBalance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After booking</span>
                  <span className={cn('font-semibold', insufficient ? 'text-destructive' : 'text-foreground')}>
                    {creditsAfter}
                  </span>
                </div>
              </CardContent>
            </Card>

            {insufficient && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Insufficient credits. You need {Math.abs(creditsAfter)} more credit{Math.abs(creditsAfter) !== 1 ? 's' : ''}.
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Any special requirements or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={insufficient || booking}
                onClick={handleConfirmBooking}
              >
                {booking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Credit History ────────────────────────────────────────────────────────────

function CreditHistorySection({ clientId }: { clientId: string }) {
  const [open, setOpen] = React.useState(false)
  const [history, setHistory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  async function loadHistory() {
    if (history.length > 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/bookings?includeCredits=true')
      if (!res.ok) throw new Error('Failed to fetch credit history')
      const data = await res.json()
      setHistory(data.creditHistory ?? [])
    } catch {
      toast.error('Failed to load credit history')
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) loadHistory()
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-sm font-semibold text-foreground"
        onClick={handleToggle}
      >
        Credit History
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No credit history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground">Description</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="py-2.5 px-4 text-foreground max-w-[200px] truncate text-xs">
                        {entry.reason}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={cn(
                            'text-[11px] font-medium px-1.5 py-0.5 rounded-full',
                            entry.type === 'credit'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {entry.type === 'credit' ? '+' : '-'}
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-4 text-right font-semibold text-xs', entry.type === 'credit' ? 'text-emerald-600' : 'text-red-600')}>
                        {entry.type === 'credit' ? '+' : '-'}{entry.amount}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground text-xs">
                        {entry.balance_after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function RoomBrowser({
  rooms,
  upcomingBookings,
  pastBookings,
  creditBalance,
  clientId,
}: RoomBrowserProps) {
  const router = useRouter()
  const [selectedRoom, setSelectedRoom] = React.useState<MeetingRoom | null>(null)
  const [cancelId, setCancelId] = React.useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = React.useState(false)

  async function handleCancelBooking() {
    if (!cancelId) return
    setCancelLoading(true)
    try {
      const res = await fetch(`/api/bookings/${cancelId}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to cancel booking')
      }
      toast.success('Booking cancelled and credits refunded.')
      setCancelId(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel booking')
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Book a Meeting Room</h2>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">{creditBalance}</span>
            <span className="text-muted-foreground">credits</span>
          </div>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No rooms available"
            description="There are currently no meeting rooms available. Please check back later."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const amenities = Array.isArray(room.amenities) ? (room.amenities as string[]) : []
              const images = Array.isArray(room.images) ? (room.images as string[]) : []
              const imageUrl = images.length > 0 ? images[0] : null

              return (
                <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  {/* Room image / placeholder */}
                  <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 relative">
                    {imageUrl ? (
                      <img src={imageUrl} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-12 w-12 text-primary/40" strokeWidth={1.5} />
                    )}
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{room.name}</h3>
                      {room.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {room.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {room.capacity} people
                        </span>
                      )}
                      {room.credits_per_hour !== null && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          {room.credits_per_hour} credits/hr
                        </span>
                      )}
                    </div>

                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {amenities.slice(0, 4).map((amenity, i) => {
                          const Icon = amenityIcon(amenity)
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              <Icon className="h-3 w-3" />
                              {amenity}
                            </span>
                          )
                        })}
                        {amenities.length > 4 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{amenities.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto">
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => setSelectedRoom(room)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">My Bookings</h2>
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming bookings"
                description="Book a room above to get started."
              />
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((b) => (
                  <Card key={b.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {b.room?.name ?? 'Meeting Room'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(b.start_time)} &middot; {b.duration_hours}h &middot; {b.credits_used} credits
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCancelId(b.id)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastBookings.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No past bookings"
                description="Your booking history will appear here."
              />
            ) : (
              <div className="space-y-2">
                {pastBookings.map((b) => (
                  <Card key={b.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {b.room?.name ?? 'Meeting Room'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(b.start_time)} &middot; {b.duration_hours}h &middot; {b.credits_used} credits
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                          b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        )}
                      >
                        {b.status}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Credit History */}
      <CreditHistorySection clientId={clientId} />

      {/* Booking Sheet */}
      {selectedRoom && (
        <BookingSheet
          room={selectedRoom}
          creditBalance={creditBalance}
          open={!!selectedRoom}
          onOpenChange={(v) => { if (!v) setSelectedRoom(null) }}
          onBooked={() => {
            setSelectedRoom(null)
            router.refresh()
          }}
        />
      )}

      {/* Cancel Confirm */}
      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => { if (!open) setCancelId(null) }}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? Your credits will be refunded."
        confirmLabel="Cancel Booking"
        variant="destructive"
        loading={cancelLoading}
        onConfirm={handleCancelBooking}
      />
    </div>
  )
}
