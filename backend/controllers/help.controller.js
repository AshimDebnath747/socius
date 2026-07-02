import { postHelpRequest, getHelpRequest, getHelpRequestById, closeHelpRequest } from "../services/help.service.js"

export const postHelpRequestController = async (req, res) => {
    try {
        const { title, description, categoryId, urgency, preferredMode, communityId } = req.body
        const userId = req.user.id
        const result = await postHelpRequest(title, description, categoryId, urgency, preferredMode, communityId, userId)
        res.status(201).json({
            success: true,
            message: "Help request uploaded successfully!",
            data: result
        })

    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "help request can not be uploaded!",
            data: err.message
        })

    }
}

export const getHelpRequestController = async (req, res) => {
    try {
        const { communityId, status } = req.validatedQuery;
        console.log(typeof (communityId))
        const result = await getHelpRequest(communityId, status)

        res.status(200).json({
            success: true,
            message: "Help request fetched successfully!",
            data: result
        })

    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "help request can not be fetched!",
            data: err.message
        })
    }
}

export const getHelpRequestByIdController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await getHelpRequestById(id)
        res.status(200).json({
            success: true,
            message: "Help request by ID fetched successfully!",
            data: result
        })


    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "help request by ID can not be fetched!",
            data: err.message
        })

    }
}

export const closeHelpRequestController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await closeHelpRequest(id)
        res.status(200).json({
            success: true,
            message: "Help request updated successfully!",
            data: result
        })




    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "help request can not be updated!",
            data: err.message
        })
    }
}