import { Router } from 'express'

import {
  getMyTeacherSlots,
  getProgramSlots,
  getRoomSlots,
  getRooms,
  getSlots,
  getTeacherSlots,
  patchRoom,
  patchSlot,
  postRoom,
  postSlot,
  removeRoom,
  removeSlot,
} from '../controllers/timetableController.js'
import {
  requireAuthenticated,
  requireTimetableManageAccess,
  requireTimetableReadAccess,
} from '../middleware/requestContext.js'

export const timetableRouter = Router()

timetableRouter.use(requireAuthenticated)

timetableRouter.get('/rooms', requireTimetableReadAccess, getRooms)
timetableRouter.post('/rooms', requireTimetableManageAccess, postRoom)
timetableRouter.patch('/rooms/:id', requireTimetableManageAccess, patchRoom)
timetableRouter.delete('/rooms/:id', requireTimetableManageAccess, removeRoom)

timetableRouter.get('/slots', requireTimetableReadAccess, getSlots)
timetableRouter.post('/slots', requireTimetableManageAccess, postSlot)
timetableRouter.patch('/slots/:id', requireTimetableManageAccess, patchSlot)
timetableRouter.delete('/slots/:id', requireTimetableManageAccess, removeSlot)

timetableRouter.get('/program/:programId/semester/:semesterId', requireTimetableReadAccess, getProgramSlots)
timetableRouter.get('/teacher/me', requireTimetableReadAccess, getMyTeacherSlots)
timetableRouter.get('/teacher/:teacherId', requireTimetableReadAccess, getTeacherSlots)
timetableRouter.get('/room/:roomId', requireTimetableReadAccess, getRoomSlots)
