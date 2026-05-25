'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { Plus, Calendar, LayoutGrid, Users, Zap, ToggleLeft, ToggleRight, Wifi, Monitor, Car, Coffee, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import type { MeetingRoom, RoomBookingWithDetails } from '@/types/database'
import { cn } from '@/lib/utils'

interface RoomManagementProps {
  rooms: MeetingRoom[]
  bookings: RoomBookingWithDetails[]
}

const AMENITY_OPTIONS = [
  { key: 'whiteboard', label: 'Whiteboard', icon: Monitor },
  { key: 'tv', label: 'TV / Display', icon: Monitor },
  { key: 'video_conferencing', label: 'Video Conferencing', icon: Wifi },
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'coffee', label: 'Coffee', icon: Coffee },
]

interface RoomFormState {
  name: string
  description: string
  capacity: string
  credits_per_hour: string
  amenities: string[]
  image_url: string
}

const DEFAULT_FORM: RoomFormState = {
  name: '',
  description: '',
  capacity: '',
  credits_per_hour: '',
  amenities: [],
  image_url: '',
}

function RoomCard({
  room,
  onEdit,
  onToggle,
}: {
  room: MeetingRoom
  onEdit: (r: MeetingRoom) => void
  onToggle: (r: MeetingRoom) => void
}) {
  const amenities = (room.amenities as string[]) ?? []

  return (
    <Card className="overflow-hidden">
      {/* Image / placeholder */}
      <div className="h-32 bg-muted flex items-center justify-center relative">
        {(room.images as string[] | null)?.[0] ? (
          <img
            src={(room.images as string[])[0]}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <LayoutGrid className="w-8 h-8" strokeWidth={1} />
            <span className="text-xs">No photo</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className={
              room.is_active
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-muted text-muted-foreground'
            }
          >
            {room.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{room.name}</h3>
            {room.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {room.capacity ?? '—'} cap.
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {room.credits_per_hour ?? '—'} hr credit/hr
          </span>
        </div>

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {amenities.slice(0, 4).map((a) => (
              <Badge key={a} variant="secondary" className="text-[10px]">
                {AMENITY_OPTIONS.find((o) => o.key === a)?.label ?? a}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(room)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(room)}
            className={room.is_active ? 'text-muted-foreground' : 'text-emerald-600'}
          >
            {room.is_active ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CalendarView({ bookings }: { bookings: RoomBookingWithDetails[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const start = startOfMonth(currentMonth)
  const end = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start, end })
  const startPadding = getDay(start) // 0 = Sunday

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="bg-muted px-2 py-1.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card min-h-[80px]" />
        ))}

        {days.map((day) => {
          const dayBookings = bookings.filter((b) =>
            isSameDay(new Date(b.start_time), day)
          )
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className="bg-card min-h-[80px] p-1.5"
            >
              <span
                className={cn(
                  'text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full mb-1',
                  isToday
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="rounded px-1 py-0.5 bg-primary/10 text-[9px] text-primary truncate"
                    title={`${b.room.name} - ${b.client.full_name}`}
                  >
                    {format(new Date(b.start_time), 'h:mm')} {b.room.name}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[9px] text-muted-foreground pl-1">
                    +{dayBookings.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RoomManagement({ rooms, bookings }: RoomManagementProps) {
  const router = useRouter()
  const supabase = createClient()

  const [localRooms, setLocalRooms] = useState(rooms)
  const [calendarView, setCalendarView] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null)
  const [form, setForm] = useState<RoomFormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditingRoom(null)
    setForm(DEFAULT_FORM)
    setFormOpen(true)
  }

  function openEdit(room: MeetingRoom) {
    setEditingRoom(room)
    setForm({
      name: room.name,
      description: room.description ?? '',
      capacity: room.capacity?.toString() ?? '',
      credits_per_hour: room.credits_per_hour?.toString() ?? '',
      amenities: (room.amenities as string[]) ?? [],
      image_url: (room.images as string[] | null)?.[0] ?? '',
    })
    setFormOpen(true)
  }

  async function handleToggle(room: MeetingRoom) {
    const newActive = !room.is_active
    setLocalRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, is_active: newActive } : r))
    )
    const { error } = await supabase
      .from('meeting_rooms')
      .update({ is_active: newActive })
      .eq('id', room.id)
    if (error) {
      toast.error('Failed to update room')
      setLocalRooms(rooms)
    } else {
      toast.success(newActive ? 'Room activated' : 'Room deactivated')
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Room name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        credits_per_hour: form.credits_per_hour
          ? parseInt(form.credits_per_hour)
          : null,
        amenities: form.amenities,
        images: form.image_url ? [form.image_url] : [],
      }

      if (editingRoom) {
        const { error } = await supabase
          .from('meeting_rooms')
          .update(payload)
          .eq('id', editingRoom.id)
        if (error) throw error
        setLocalRooms((prev) =>
          prev.map((r) =>
            r.id === editingRoom.id ? { ...r, ...payload } : r
          )
        )
        toast.success('Room updated')
      } else {
        const { data, error } = await supabase
          .from('meeting_rooms')
          .insert({ ...payload, is_active: true })
          .select()
          .single()
        if (error) throw error
        setLocalRooms((prev) => [...prev, data as MeetingRoom])
        toast.success('Room created')
      }

      setFormOpen(false)
    } catch {
      toast.error('Failed to save room')
    } finally {
      setSaving(false)
    }
  }

  function toggleAmenity(key: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }))
  }

  return (
    <div>
      <PageHeader
        title="Room Management"
        description={`${localRooms.length} meeting rooms`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarView((v) => !v)}
              className={cn(calendarView && 'bg-accent')}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              {calendarView ? 'Grid View' : 'Calendar View'}
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </div>
        }
      />

      {!calendarView ? (
        <div>
          {localRooms.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No rooms yet"
              description="Add your first meeting room to get started."
              action={{ label: 'Add Room', onClick: openCreate }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {localRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <CalendarView bookings={bookings} />
          </CardContent>
        </Card>
      )}

      {/* Room form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Edit Room' : 'Add Room'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Room Name *</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. Boardroom A"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1.5 min-h-[72px]"
                placeholder="Room description..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="e.g. 8"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  min="1"
                />
              </div>
              <div>
                <Label>Meeting Room Credits / Hour</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="e.g. 2"
                  value={form.credits_per_hour}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      credits_per_hour: e.target.value,
                    }))
                  }
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                className="mt-1.5"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image_url: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a Supabase Storage URL or external image link
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Amenities</Label>
              <div className="space-y-2">
                {AMENITY_OPTIONS.map((opt) => (
                  <div
                    key={opt.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{opt.label}</span>
                    <Switch
                      checked={form.amenities.includes(opt.key)}
                      onCheckedChange={() => toggleAmenity(opt.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
