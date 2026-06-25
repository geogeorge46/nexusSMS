import { getAuditContext } from '../middleware/auditMiddleware.js'
import {
  createAdmin,
  deleteAdmin,
  getAdmin,
  listAdmins,
  resetAdminPassword,
  updateAdmin,
} from '../services/adminService.js'
import { createAuditLog } from '../services/auditLogService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getAdmins = asyncHandler(async (req, res) => {
  res.json(await listAdmins(req.query))
})

export const getAdminById = asyncHandler(async (req, res) => {
  res.json({ admin: await getAdmin(req.params.adminId) })
})

export const postAdmin = asyncHandler(async (req, res) => {
  const admin = await createAdmin(req.body)
  await audit(req, 'ADMIN_CREATE', `Created ${admin.role} account for ${admin.email}`, admin.id)
  res.status(201).json({ admin })
})

export const patchAdmin = asyncHandler(async (req, res) => {
  const result = await updateAdmin(req.params.adminId, req.body, req.user)
  for (const change of result.changes) {
    const action = change === 'role' ? 'ADMIN_ROLE_CHANGE' : change === 'status' ? 'ADMIN_STATUS_CHANGE' : 'ADMIN_UPDATE'
    await audit(req, action, `Updated ${change} for ${result.admin.email}`, result.admin.id)
  }
  res.json({ admin: result.admin })
})

export const patchAdminPassword = asyncHandler(async (req, res) => {
  const admin = await resetAdminPassword(req.params.adminId, req.body.password)
  await audit(req, 'ADMIN_PASSWORD_RESET', `Reset password for ${admin.email}`, admin.id)
  res.json({ admin, message: 'Password reset successfully' })
})

export const removeAdmin = asyncHandler(async (req, res) => {
  const admin = await deleteAdmin(req.params.adminId, req.user)
  await audit(req, 'ADMIN_DELETE', `Deleted admin account ${admin.email}`, admin.id)
  res.json({ admin, message: 'Admin account deleted' })
})

function audit(req, action, description, adminId) {
  return createAuditLog({
    ...getAuditContext(req), action, module: 'Admins', description,
    metadata: { adminId, actorId: req.user.id },
  })
}
