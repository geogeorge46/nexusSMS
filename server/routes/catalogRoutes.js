import { Router } from 'express'

import { getCatalog, patchCatalog, postCatalog, removeCatalog } from '../controllers/catalogController.js'
import { requireAdmin, requireAuthenticated, requireNonStudent } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const catalogRouter = Router()

catalogRouter.use(requireAuthenticated)
catalogRouter.get('/:resource', requireNonStudent, asyncHandler(getCatalog))
catalogRouter.post('/:resource', requireAdmin, asyncHandler(postCatalog))
catalogRouter.patch('/:resource/:id', requireAdmin, asyncHandler(patchCatalog))
catalogRouter.delete('/:resource/:id', requireAdmin, asyncHandler(removeCatalog))
