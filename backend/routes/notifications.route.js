import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { getAllNotificationsController } from "../controllers/notifications.controller.js"
const router = express.Router()

router.use(authMiddleware)

router.get("/", getAllNotificationsController)

export default router