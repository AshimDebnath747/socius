import express from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { helpRequestAcceptValidation } from '../validators/help.validator.js'
import { helpRequestAcceptController, getSessionByIdController, endSessionByIdController, cancelSessionByIdController, getMessagesController, getAllSessionsController } from '../controllers/session.controller.js'

const router = express.Router()

router.use(authMiddleware)

//post request -> help request accept
router.post("/request", validate(helpRequestAcceptValidation), helpRequestAcceptController)

//get request
router.get("/", getAllSessionsController)
router.get("/:id", getSessionByIdController)
router.get("/:id/messages", getMessagesController)

//put requests
router.put("/:id/end", endSessionByIdController)
router.put("/:id/cancel", cancelSessionByIdController)


export default router