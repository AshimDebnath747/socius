import { createCommunity } from "../services/communities.service.js"

export const createCommunityController = async (req, res) => {
    try {
        const result = await createCommunity(req.body)

        res.status(201).json({
            success: true,
            message: "json updated successfully",
            data: result
        })

    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "user could not be updated!",
            data: err.message
        })
    }
}