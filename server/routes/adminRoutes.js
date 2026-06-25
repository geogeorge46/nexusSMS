import { Router } from 'express'

import {
  getAdminById,
  getAdmins,
  patchAdmin,
  patchAdminPassword,
  postAdmin,
  removeAdmin,
} from '../controllers/adminController.js'
import { requireSuperAdmin } from '../middleware/requestContext.js'

export const adminRouter = Router()

adminRouter.use(requireSuperAdmin)
adminRouter.get('/', getAdmins)
adminRouter.post('/', postAdmin)
adminRouter.get('/:adminId', getAdminById)
adminRouter.patch('/:adminId', patchAdmin)
adminRouter.patch('/:adminId/password', patchAdminPassword)
adminRouter.delete('/:adminId', removeAdmin)
