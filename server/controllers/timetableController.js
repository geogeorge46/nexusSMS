import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  createRoom,
  createSlot,
  deleteRoom,
  deleteSlot,
  getOwnTeacherTimetable,
  getProgramTimetable,
  getRoomTimetable,
  getTeacherTimetable,
  listRooms,
  listSlots,
  updateRoom,
  updateSlot,
} from '../services/timetableService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getRooms = asyncHandler(async (req, res) => res.json(await listRooms(req.query)))

export const postRoom = asyncHandler(async (req, res) => {
  const item = await createRoom(req.body)
  await audit(req, 'ROOM_CREATE', 'Rooms', 'created a room', { id: item.id })
  res.status(201).json({ item })
})

export const patchRoom = asyncHandler(async (req, res) => {
  const item = await updateRoom(req.params.id, req.body)
  await audit(req, 'ROOM_UPDATE', 'Rooms', 'updated a room', { id: item.id })
  res.json({ item })
})

export const removeRoom = asyncHandler(async (req, res) => {
  const item = await deleteRoom(req.params.id)
  await audit(req, 'ROOM_DELETE', 'Rooms', 'deactivated a room', { id: item.id })
  res.json({ item })
})

export const getSlots = asyncHandler(async (req, res) => res.json(await listSlots(req.query)))

export const postSlot = asyncHandler(async (req, res) => {
  const item = await createSlot(req.body, req.user)
  await audit(req, 'TIMETABLE_SLOT_CREATE', 'Timetable', 'created a timetable slot', { id: item.id })
  res.status(201).json({ item })
})

export const patchSlot = asyncHandler(async (req, res) => {
  const item = await updateSlot(req.params.id, req.body)
  await audit(req, 'TIMETABLE_SLOT_UPDATE', 'Timetable', 'updated a timetable slot', { id: item.id })
  res.json({ item })
})

export const removeSlot = asyncHandler(async (req, res) => {
  const item = await deleteSlot(req.params.id)
  await audit(req, 'TIMETABLE_SLOT_DELETE', 'Timetable', 'cancelled a timetable slot', { id: item.id })
  res.json({ item })
})

export const getProgramSlots = asyncHandler(async (req, res) => {
  res.json(await getProgramTimetable(req.params.programId, req.params.semesterId, req.query))
})

export const getTeacherSlots = asyncHandler(async (req, res) => {
  res.json(await getTeacherTimetable(req.params.teacherId, req.user, req.query))
})

export const getMyTeacherSlots = asyncHandler(async (req, res) => {
  res.json(await getOwnTeacherTimetable(req.user, req.query))
})

export const getRoomSlots = asyncHandler(async (req, res) => {
  res.json(await getRoomTimetable(req.params.roomId, req.query))
})

function audit(req, action, module, description, metadata) {
  return createAuditLog({
    ...getAuditContext(req),
    action,
    module,
    description: `${req.user.name} ${description}`,
    metadata,
  })
}
