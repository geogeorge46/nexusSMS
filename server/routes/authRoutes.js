import { Router } from 'express'

import { getCurrentUser, login, logout, signup } from '../controllers/authController.js'
import { requireAuthenticated } from '../middleware/requestContext.js'

export const authRouter = Router()

authRouter.post('/signup', signup)
authRouter.post('/login', login)
authRouter.get('/me', requireAuthenticated, getCurrentUser)
authRouter.post('/logout', requireAuthenticated, logout)
