import { CalendarDays, DoorOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/molecules/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalog } from '@/hooks/use-catalog'
import { useCourses } from '@/hooks/use-courses'
import {
  getTimetableErrorMessage,
  refLabel,
  refValue,
  useCreateRoom,
  useCreateTimetableSlot,
  useDeleteRoom,
  useDeleteTimetableSlot,
  useMyTeacherTimetable,
  useRooms,
  useTimetableSlots,
  useUpdateRoom,
  useUpdateTimetableSlot,
  type Room,
  type RoomPayload,
  type SlotPayload,
  type TimetableSlot,
} from '@/hooks/use-timetable'
import { useAuth } from '@/hooks/use-auth'
import { canManageTimetable, isTeacher } from '@/lib/permissions'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const roomTypes = ['Classroom', 'Lab', 'Seminar Hall', 'Auditorium', 'Other']
const slotTypes = ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Exam', 'Other']

export function TimetableManagementPage() {
  const { user } = useAuth()
  const canManage = canManageTimetable(user)
  const teacherOnly = isTeacher(user) && !canManage
  const [message, setMessage] = useState('')
  const [editingRoom, setEditingRoom] = useState<Room>()
  const [editingSlot, setEditingSlot] = useState<TimetableSlot>()

  const rooms = useRooms()
  const slots = useTimetableSlots()
  const myTeacherSlots = useMyTeacherTimetable(teacherOnly)
  const departments = useCatalog('departments', { status: 'Active' })
  const programs = useCatalog('programs', { status: 'Active' })
  const academicYears = useCatalog('academicYears', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const staff = useCatalog('staff', { status: 'Active' })
  const courses = useCourses({ search: '', status: 'Active', department: 'All', page: 1, limit: 300 })

  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()
  const createSlot = useCreateTimetableSlot()
  const updateSlot = useUpdateTimetableSlot()
  const deleteSlot = useDeleteTimetableSlot()

  const displayedSlots = teacherOnly ? myTeacherSlots.data?.items ?? [] : slots.data?.items ?? []
  const teachingStaff = useMemo(() => (staff.data?.items ?? []).filter((item) => item.category === 'Teaching'), [staff.data?.items])
  const loading = [rooms, slots, departments, programs, academicYears, semesters, staff, courses].some((query) => query.isLoading) || (teacherOnly && myTeacherSlots.isLoading)
  const error = [
    rooms.error,
    slots.error,
    myTeacherSlots.error,
    createRoom.error,
    updateRoom.error,
    deleteRoom.error,
    createSlot.error,
    updateSlot.error,
    deleteSlot.error,
  ].find(Boolean)

  async function saveRoom(values: RoomPayload) {
    setMessage('')
    const payload = { ...values, capacity: Number(values.capacity) }
    if (editingRoom) {
      await updateRoom.mutateAsync({ id: editingRoom.id, payload })
      setEditingRoom(undefined)
      setMessage('Room updated.')
      return
    }
    await createRoom.mutateAsync(payload)
    setMessage('Room created.')
  }

  async function saveSlot(values: SlotPayload) {
    setMessage('')
    if (editingSlot) {
      await updateSlot.mutateAsync({ id: editingSlot.id, payload: values })
      setEditingSlot(undefined)
      setMessage('Timetable slot updated.')
      return
    }
    await createSlot.mutateAsync(values)
    setMessage('Timetable slot created.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Timetable"
        title={teacherOnly ? 'My Timetable' : 'Timetable Management'}
        description={teacherOnly ? 'Your assigned weekly class schedule.' : 'Manage rooms, weekly class slots, and conflict-free teacher, room, and student batch schedules.'}
      />

      {message && <p className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{getTimetableErrorMessage(error)}</p>}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton className="h-24" key={index} />)}</div>
      ) : (
        <>
          {canManage && (
            <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
              <RoomPanel
                editing={editingRoom}
                isPending={createRoom.isPending || updateRoom.isPending}
                rooms={rooms.data?.items ?? []}
                onDelete={(room) => void deleteRoom.mutateAsync(room.id).then(() => setMessage('Room deactivated.'))}
                onEdit={setEditingRoom}
                onSubmit={(values) => void saveRoom(values)}
              />
              <SlotPanel
                academicYears={academicYears.data?.items ?? []}
                courses={courses.data?.items ?? []}
                departments={departments.data?.items ?? []}
                editing={editingSlot}
                isPending={createSlot.isPending || updateSlot.isPending}
                programs={programs.data?.items ?? []}
                rooms={rooms.data?.items ?? []}
                semesters={semesters.data?.items ?? []}
                staff={teachingStaff}
                onSubmit={(values) => void saveSlot(values)}
              />
            </section>
          )}

          <WeeklyGrid canManage={canManage} slots={displayedSlots} onDelete={(slot) => void deleteSlot.mutateAsync(slot.id).then(() => setMessage('Timetable slot cancelled.'))} onEdit={setEditingSlot} />
        </>
      )}
    </div>
  )
}

function RoomPanel({ editing, isPending, rooms, onDelete, onEdit, onSubmit }: {
  editing?: Room
  isPending: boolean
  rooms: Room[]
  onDelete: (room: Room) => void
  onEdit: (room: Room) => void
  onSubmit: (values: RoomPayload) => void
}) {
  const form = useForm<RoomPayload>({
    values: editing ?? { name: '', roomNumber: '', building: '', capacity: 40, type: 'Classroom', status: 'Active' },
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DoorOpen className="size-5 text-primary" />Rooms</CardTitle>
        <CardDescription>Classrooms, labs, seminar halls, and other schedulable spaces.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void form.handleSubmit((values) => onSubmit(values))(event)}>
          <Input label="Room Name" {...form.register('name', { required: true })} />
          <Input label="Room Number" {...form.register('roomNumber', { required: true })} />
          <Input label="Building" {...form.register('building', { required: true })} />
          <Input label="Capacity" type="number" {...form.register('capacity', { required: true, valueAsNumber: true })} />
          <Select label="Type" {...form.register('type')}>{roomTypes.map((type) => <option key={type}>{type}</option>)}</Select>
          <Select label="Status" {...form.register('status')}><option>Active</option><option>Inactive</option></Select>
          <Button className="sm:col-span-2" disabled={isPending} type="submit"><Plus />{editing ? 'Save Room' : 'Create Room'}</Button>
        </form>
        <div className="divide-y divide-border/70 overflow-hidden rounded-[18px] border border-border/70">
          {rooms.map((room) => (
            <div className="flex items-center justify-between gap-3 p-3" key={room.id}>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{room.name} ({room.roomNumber})</p>
                <p className="truncate text-xs text-muted-foreground">{room.building} - {room.type} - {room.capacity} seats</p>
              </div>
              <div className="flex gap-1">
                <Button aria-label="Edit room" onClick={() => onEdit(room)} size="icon" type="button" variant="ghost"><Pencil /></Button>
                <Button aria-label="Deactivate room" onClick={() => onDelete(room)} size="icon" type="button" variant="ghost"><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SlotPanel({ academicYears, courses, departments, editing, isPending, programs, rooms, semesters, staff, onSubmit }: {
  academicYears: Array<{ id: string; name?: string }>
  courses: Array<{ databaseId: string; title: string; code?: string }>
  departments: Array<{ id: string; name?: string }>
  editing?: TimetableSlot
  isPending: boolean
  programs: Array<{ id: string; name?: string }>
  rooms: Room[]
  semesters: Array<{ id: string; name?: string }>
  staff: Array<{ id: string; name?: string; employeeNumber?: string }>
  onSubmit: (values: SlotPayload) => void
}) {
  const form = useForm<SlotPayload>({
    values: editing
      ? {
          departmentId: refValue(editing.departmentId),
          programId: refValue(editing.programId),
          semesterId: refValue(editing.semesterId),
          academicYearId: refValue(editing.academicYearId),
          courseId: refValue(editing.courseId),
          staffId: refValue(editing.staffId),
          roomId: refValue(editing.roomId),
          dayOfWeek: editing.dayOfWeek,
          startTime: editing.startTime,
          endTime: editing.endTime,
          slotType: editing.slotType,
          status: editing.status,
        }
      : {
          departmentId: '',
          programId: '',
          semesterId: '',
          academicYearId: '',
          courseId: '',
          staffId: '',
          roomId: '',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          slotType: 'Lecture',
          status: 'Active',
        },
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="size-5 text-primary" />Create/Edit Slot</CardTitle>
        <CardDescription>Only assigned teachers, active rooms, and conflict-free slots are accepted.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => void form.handleSubmit((values) => onSubmit(values))(event)}>
          <Select label="Department" {...form.register('departmentId', { required: true })}>{options(departments)}</Select>
          <Select label="Program" {...form.register('programId', { required: true })}>{options(programs)}</Select>
          <Select label="Academic Year" {...form.register('academicYearId', { required: true })}>{options(academicYears)}</Select>
          <Select label="Semester" {...form.register('semesterId', { required: true })}>{options(semesters)}</Select>
          <Select label="Course" {...form.register('courseId', { required: true })}>
            <option value="">Select</option>
            {courses.map((course) => <option key={course.databaseId} value={course.databaseId}>{course.title}</option>)}
          </Select>
          <Select label="Teacher" {...form.register('staffId', { required: true })}>{options(staff)}</Select>
          <Select label="Room" {...form.register('roomId', { required: true })}>
            <option value="">Select</option>
            {rooms.filter((room) => room.status === 'Active').map((room) => <option key={room.id} value={room.id}>{room.name} ({room.roomNumber})</option>)}
          </Select>
          <Select label="Day" {...form.register('dayOfWeek')}>{days.map((day) => <option key={day}>{day}</option>)}</Select>
          <Input label="Start" type="time" {...form.register('startTime', { required: true })} />
          <Input label="End" type="time" {...form.register('endTime', { required: true })} />
          <Select label="Type" {...form.register('slotType')}>{slotTypes.map((type) => <option key={type}>{type}</option>)}</Select>
          <Select label="Status" {...form.register('status')}><option>Active</option><option>Inactive</option><option>Cancelled</option></Select>
          <Button className="xl:col-span-3" disabled={isPending} type="submit"><Plus />{editing ? 'Save Slot' : 'Create Slot'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function WeeklyGrid({ canManage, slots, onDelete, onEdit }: {
  canManage: boolean
  slots: TimetableSlot[]
  onDelete: (slot: TimetableSlot) => void
  onEdit: (slot: TimetableSlot) => void
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Weekly Calendar</h2>
          <p className="text-sm text-muted-foreground">{slots.length} active timetable slots</p>
        </div>
        <Badge className="border-primary/20 bg-primary/10 text-primary">Conflict checked</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {days.map((day) => {
          const daySlots = slots.filter((slot) => slot.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
          return (
            <section className="rounded-[18px] border border-border/70 bg-background/55 p-4" key={day}>
              <h3 className="font-bold">{day}</h3>
              <div className="mt-4 space-y-3">
                {daySlots.length ? daySlots.map((slot) => (
                  <article className="rounded-[16px] border border-border/70 bg-muted/35 p-3" key={slot.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{slot.startTime} - {slot.endTime}</p>
                        <p className="mt-1 text-sm font-semibold">{refLabel(slot.courseId, 'title')}</p>
                      </div>
                      <Badge>{slot.slotType}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{refLabel(slot.staffId)} - {refLabel(slot.roomId)} - {refLabel(slot.programId)}</p>
                    {canManage && (
                      <div className="mt-3 flex gap-2">
                        <Button onClick={() => onEdit(slot)} size="sm" type="button" variant="glass"><Pencil />Edit</Button>
                        <Button onClick={() => onDelete(slot)} size="sm" type="button" variant="ghost"><Trash2 />Cancel</Button>
                      </div>
                    )}
                  </article>
                )) : <p className="text-sm text-muted-foreground">Free periods all day.</p>}
              </div>
            </section>
          )
        })}
      </div>
    </GlassCard>
  )
}

function Input({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><input className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} /></label>
}

function Select({ label, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><select className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props}>{children}</select></label>
}

function options(items: Array<{ id: string; name?: string; employeeNumber?: string }>) {
  return <><option value="">Select</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.id}{item.employeeNumber ? ` (${item.employeeNumber})` : ''}</option>)}</>
}
