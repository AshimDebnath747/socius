import express from 'express'
import { postHelpRequestController, getHelpRequestController, getHelpRequestByIdController, closeHelpRequestController } from '../controllers/help.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validateQuery, validate } from '../middlewares/validate.middleware.js'
import { createHelpRequest, getHelpRequestQuery } from '../validators/help.validator.js'

const router = express.Router()

router.use(authMiddleware)

//post requests
router.post("/", validate(createHelpRequest), postHelpRequestController)

//get requests
router.get("/", validateQuery(getHelpRequestQuery), getHelpRequestController)
router.get("/:id", getHelpRequestByIdController)

//put requests
router.put("/:id/close", closeHelpRequestController)

export default router
