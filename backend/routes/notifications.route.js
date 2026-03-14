import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { getAllNotificationsController, readMessageByIdController, readAllMessageController } from "../controllers/notifications.controller.js"
const router = express.Router()

router.use(authMiddleware)
//get requests
router.get("/", getAllNotificationsController)

//put requests
router.put("/:id/read", readMessageByIdController)
router.put("/read-all", readAllMessageController)

export default router