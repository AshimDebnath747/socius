import { helpRequestAccept, getSessionById, endSessionById, cancelSessionById, getMessages, getAllSessions } from "../services/session.service.js"

import { getIO } from "../sockets/index.js"

export const helpRequestAcceptController = async (req, res) => {

    try {
        const { helpRequestId, mode } = req.body
        const helperId = req.user.id

        const session = await helpRequestAccept(helpRequestId, helperId, mode)
        const io = getIO();
        const RequesterId = session.requester_id
        io.to(`user-${session.requester_id}`).emit("join-session", session.id);
        io.to(`user-${session.helper_id}`).emit("join-session", session.id);
        io.to(`user-${RequesterId}`).emit("new-chat", {
            sessionId: session.id,
            helperId: req.user.id,
        });
        return res.status(201).json({
            success: true,
            message: "session created successfully",
            data: session
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be created!",
            data: err.message
        })
    }
}

export const getSessionByIdController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await getSessionById(id)
        return res.status(200).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })

    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })
    }
}

export const endSessionByIdController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await endSessionById(id)

        return res.status(201).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })


    } catch (err) {

        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })

    }
}

export const cancelSessionByIdController = async (req, res) => {
    try {

        const { id } = req.params

        const result = await cancelSessionById(id)
        return res.status(200).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })
    }
}

export const getMessagesController = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id

        const result = await getMessages(id, userId)
        return res.status(200).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })



    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })
    }
}

export const getAllSessionsController = async (req, res) => {
    try {
        const userId = req.user.id

        const result = await getAllSessions(userId)
        return res.status(200).json({
            success: true,
            message: "sessions fetched successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "sessions could not be fetched!",
            data: err.message
        })
    }

}