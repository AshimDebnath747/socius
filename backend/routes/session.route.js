import express from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { helpRequestAcceptValidation } from '../validators/help.validator.js'
import { helpRequestAcceptController, getSessionByIdController } from '../controllers/session.controller.js'

const router = express.Router()

router.use(authMiddleware)

//post request
router.post("/request", validate(helpRequestAcceptValidation), helpRequestAcceptController)

//get request
router.get("/:id", getSessionByIdController)


export default router