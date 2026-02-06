import { helpRequestAccept, getSessionById } from "../services/session.service.js"

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