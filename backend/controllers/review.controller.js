import { reviewPost } from "../services/review.service.js"

export const reviewPostController = async (req, res) => {
    try {
        const reviewer_id = req.user.id
        const { session_id, rating, comment } = req.body


        const result = await reviewPost(reviewer_id, session_id, rating, comment)

        return res.status(201).json({
            success: true,
            message: "review posted successfully",
            data: result
        })

    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "review could not be posted!",
            data: err.message
        })
    }
}