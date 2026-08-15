import express from 'express'
import { validate } from '../middlewares/validate.middleware.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { helpRequestAcceptValidation } from '../validators/help.validator.js'
import {
    helpRequestAcceptController,
    getSessionByIdController,
    endSessionByIdController,
    cancelSessionByIdController,
    getMessagesController,
    getAllSessionsController,
    uploadSessionMediaController
} from '../controllers/session.controller.js'

import { uploadChatMedia } from "../middlewares/upload.middleware.js";

const router = express.Router()

router.use(authMiddleware)

//post request -> help request accept
router.post("/request", validate(helpRequestAcceptValidation), helpRequestAcceptController)

//get request
router.get("/", getAllSessionsController)
router.get("/:id", getSessionByIdController)
router.get("/:id/messages", getMessagesController)
router.post(
    "/:id/media",
    uploadChatMedia.single("media"),
    uploadSessionMediaController
);

//put requests
router.put("/:id/end", endSessionByIdController)
router.put("/:id/cancel", cancelSessionByIdController)


export default router