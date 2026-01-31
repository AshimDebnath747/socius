import { createCommunity, getCommunities, getCommunityById, joinCommunity, leaveCommunity } from "../services/communities.service.js"

export const createCommunityController = async (req, res) => {

    try {
        const userid = req.user.id
        const time = new Date();
        const { name, description, rules, is_private } = req.body
        const result = await createCommunity(name, description, rules, is_private, userid, time)

        res.status(201).json({
            success: true,
            message: "community created successfully",
            data: result
        })

    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "community could not be created!",
            data: err.message
        })
    }
}

export const getCommunitiesController = async (req, res) => {
    try {
        const result = await getCommunities()
        res.status(201).json({
            success: true,
            message: "communities fetched successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "communities could not be fetched!",
            data: err.message
        })
    }
}

export const getCommunityByIdController = async (req, res) => {
    try {
        const { id } = req.params
        const result = await getCommunityById(id)
        res.status(201).json({
            success: true,
            message: "community fetched successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "community could not be fetched!",
            data: err.message
        })
    }
}

export const joinCommunityController = async (req, res) => {
    try {
        const communityId = req.params.id
        const userId = req.user.id
        const time = new Date();
        const result = await joinCommunity(communityId, userId, time)
        res.status(201).json({
            success: true,
            message: "community joined successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "community could not be joined!",
            data: err.message
        })
    }
}

export const leaveCommunityController = async (req, res) => {
    try {
        const communityId = req.params.id
        const userId = req.user.id

        const result = await leaveCommunity(communityId, userId)
        res.status(201).json({
            success: true,
            message: "community left successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "community could not be left!",
            data: err.message
        })
    }
}