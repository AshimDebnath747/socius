
import { getAllNotifications } from "../services/notifications.service.js"
export const getAllNotificationsController = async (req, res) => {
    try {
        const userId = req.user.id

        const result = getAllNotifications(userId)

        return res.status(201).json({
            success: true,
            message: "Notifications fetched successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "Can not fetch Notifications!",
            data: err.message
        })
    }
}