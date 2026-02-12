import { helpRequestAccept, getSessionById, endSessionById, cancelSessionById, getMessages } from "../services/session.service.js"

export const helpRequestAcceptController = async (req, res) => {

    try {
        const { helpRequestId, mode } = req.body
        const helperId = req.user.id

        const result = await helpRequestAccept(helpRequestId, helperId, mode)
        return res.status(201).json({
            success: true,
            message: "session posted successfully",
            data: result
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be posted!",
            data: err.message
        })
    }
}

export const getSessionByIdController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await getSessionById(id)
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

export const getMessagesController = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id

        const result = await getMessages(id, userId)
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