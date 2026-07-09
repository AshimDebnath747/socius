import { getUserById, putUser, getReviewsById, getNextUserById } from "../services/user.service.js";
export const getUserByIdController = async (req, res) => {
    const userId  = req.user.id
    try {
        const result = await getUserById(userId);

        return res.status(201).json({
            success: true,
            message: "user fetched successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "user could not be fetched!",
            data: err.message
        })
    }
}

export const putUserController = async (req, res) => {
    const { name, email, skills, id } = req.body
    try {
        const result = await putUser(name, email, skills, id)
        return res.status(201).json({
            success: true,
            message: "user updated successfully",
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

export const getReviewsByIdController = async (req, res) => {

    try {
        const id = req.params.id
        const { page, limit } = req.validatedQuery

        const result = await getReviewsById(id, page, limit)
        return res.status(201).json({
            success: true,
            message: "user updated successfully",
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

// Get user by id for next user to chat.

export const getNextUserByIdController = async (req, res) => {
    const { helper_id, requester_id } = req.body;
    const currentUserId = req.user?.id;

    if (helper_id == null || requester_id == null) {
        return res.status(400).json({
            success: false,
            message: "helper_id and requester_id are required",
        });
    }

    try {
        const result = await getNextUserById(helper_id, requester_id, currentUserId);

        return res.status(200).json({
            success: true,
            message: "user fetched successfully",
            data: result
        });
    } catch (err) {
        console.log("message:", err.message);
        return res.status(400).json({
            success: false,
            message: "user could not be fetched!",
            data: err.message
        });
    }
}