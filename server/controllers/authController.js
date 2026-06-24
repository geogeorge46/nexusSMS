import { getAuditContext } from '../middleware/auditMiddleware.js'
import { loginUser } from '../services/authService.js'
import { createAuditLog } from '../services/auditLogService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const signup = asyncHandler(async (_req, res) => {
  // TODO: Replace public registration with protected user provisioning in the Admin Management module.
  res.status(403).json({ message: 'Public registration is disabled' })
})

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser({
    email: req.body.email,
    password: req.body.password,
  })

  req.user = {
    id: result.user.id,
    name: result.user.name,
    role: result.user.role,
  }

  await createAuditLog({
    ...getAuditContext(req),
    action: 'LOGIN',
    module: 'Auth',
    description: `${result.user.name} signed in`,
    metadata: { userId: result.user.id },
  })

  res.json(result)
})

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: req.user })
})

export const logout = asyncHandler(async (req, res) => {
  await createAuditLog({
    ...getAuditContext(req),
    action: 'LOGOUT',
    module: 'Auth',
    description: `${req.user.name} signed out`,
    metadata: { userId: req.user.id },
  })

  res.json({ message: 'Logged out' })
})
