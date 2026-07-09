import { createCommunity, getCommunities, getCommunityBySlugService, joinCommunity, leaveCommunity, getAllCommunityMembers, changeRole, getComminityMessagesService, getAllCommunitiesService, joinRequestService, getCommunityJoinRequestsService, acceptJoinRequestService, rejectJoinRequestService, getJoinRequestStatusService } from "../services/communities.service.js"

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
        const userId = req.user.id

        const result = await getCommunities(userId)
        res.status(200).json({
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

export const getCommunityBySlugController = async (req, res) => {
    try {
        const { slug } = req.params
        const result = await getCommunityBySlugService(slug)
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

export const getAllCommunityMembersController = async (req, res) => {
    try {
        const communityId = req.params.id
        const result = await getAllCommunityMembers(communityId)

        res.status(201).json({
            success: true,
            message: "community members fetched successfully!",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "community members could not be fetched!",
            data: err.message
        })
    }
}

export const changeRoleController = async (req, res) => {
    try {
        const AdminId = req.user.id
        const role = req.body.role
        const communityId = req.params.id
        const userId = req.params.userId

        const result = await changeRole(AdminId, role, communityId, userId)
        res.status(201).json({
            success: true,
            message: "community member's role updated successfully!",
            data: result
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "community member's role could not be updated!",
            data: err.message
        })
    }
}

export const getComminityMessages = async (req, res) => {
    try {
        const communityId = req.params.id
        const userId = req.user.id
        const result = await getComminityMessagesService(communityId, userId)
        res.status(201).json({
            success: true,
            message: "community messages fetched successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "community messages could not be fetched!",
            data: err.message
        })
    }
}

export const getAllCommunitiesController = async (req, res) => {
    try {
        const result = await getAllCommunitiesService()
        res.status(201).json({
            success: true,
            message: "communities  fetched successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "communities could not be fetched!",
            data: err.message
        })
    }
}

export const joinRequestController = async (req, res) => {
    try {
        const communityId = req.params.id
        const userId = req.user.id
        const result = await joinRequestService(communityId, userId)
        res.status(201).json({
            success: true,
            message: "oin request inserted successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "join request could not be inserted!",
            data: err.message
        })
    }
}

export const getCommunityJoinRequestsController = async (req, res) => {
    try {
        const communityId = req.params.id
        const userId = req.user.id
        const result = await getCommunityJoinRequestsService(communityId, userId)
        res.status(201).json({
            success: true,
            message: "join request fetched successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "join request could not be fetched!",
            data: err.message
        })
    }
}

export const acceptJoinRequestController = async (req, res) => {
    try {
        const communityId = req.params.id
        const requestId = req.params.requestId
        const userId = req.user.id
        const result = await acceptJoinRequestService(communityId, requestId, userId)
        res.status(201).json({
            success: true,
            message: "join request accepted successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "join request could not be accepted!",
            data: err.message
        })
    }
}

export const rejectJoinRequestController = async (req, res) => {
    try {
        const communityId = req.params.id
        const requestId = req.params.requestId
        const userId = req.user.id
        const result = await rejectJoinRequestService(communityId, requestId, userId)
        res.status(201).json({
            success: true,
            message: "join request rejected successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "join request could not be rejected!",
            data: err.message
        })
    }
}

export const getJoinRequestStatus = async (req, res) => {
    try {
        const communityId = req.params.id
        const userId = req.user.id
        const result = await getJoinRequestStatusService(communityId, userId)
        res.status(201).json({
            success: true,
            message: "join request rejected successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "join request could not be rejected!",
            data: err.message
        })
    }

}

