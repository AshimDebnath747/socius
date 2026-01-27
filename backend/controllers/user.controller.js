import { getUserById, putUser } from "../services/user.service.js";
export const getUserByIdController = async (req, res) => {
    const { id } = req.params
    try {
        const result = await getUserById(id);

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
        const result = putUser(name, email, skills, id)
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