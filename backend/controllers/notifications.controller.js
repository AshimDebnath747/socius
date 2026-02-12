
import { getAllNotifications, readMessageById, readAllMessage } from "../services/notifications.service.js"
export const getAllNotificationsController = async (req, res) => {
    try {
        const userId = req.user.id

        const result = await getAllNotifications(userId)

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

export const readMessageByIdController = async (req, res) => {
    try {
        const mId = req.params.id
        const userId = req.user.id

        const result = await readMessageById(mId, userId)
        return res.status(201).json({
            success: true,
            message: "Notifications read successfully",
            data: result
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "Can not read Notifications!",
            data: err.message
        })
    }
}

export const readAllMessageController = async (req, res) => {
    try {
        const userId = req.user.id

        const result = await readAllMessage(userId)

        return res.status(201).json({
            success: true,
            message: "Notifications read successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "Can not read Notifications!",
            data: err.message
        })
    }
}