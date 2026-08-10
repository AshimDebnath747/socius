import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate } from '../middlewares/validate.middleware.js';
import { createCommunitySchema } from '../validators/communities.validator.js';
import { createCommunityController, getCommunitiesController, getCommunityBySlugController, joinCommunityController, leaveCommunityController, getAllCommunityMembersController, changeRoleController, getComminityMessages, getAllCommunitiesController, joinRequestController, getCommunityJoinRequestsController, acceptJoinRequestController, rejectJoinRequestController, getJoinRequestStatus, checkMembershipController } from '../controllers/communities.controller.js';
import { uploadCommunityAvatar } from '../middlewares/uploadCommunityAvatar.js';
const router = express.Router()

//middleware
router.use(authMiddleware)
//post requests:
router.post("/", uploadCommunityAvatar.single("avatar"), validate(createCommunitySchema), createCommunityController)
router.post("/:id/join", joinCommunityController)
router.post("/:id/join-request", joinRequestController)
router.post("/:id/join-requests/:requestId/accept", acceptJoinRequestController)
router.post("/:id/join-requests/:requestId/reject", rejectJoinRequestController)
router.post("/:id/leave", leaveCommunityController)

//put requests:
router.put("/:id/members/:userId/role", changeRoleController)

//get requests:
router.get("/", getCommunitiesController)
router.get("/all", getAllCommunitiesController)
router.get("/:slug", getCommunityBySlugController)
router.get("/:id/members", getAllCommunityMembersController)
router.get("/:id/messages", getComminityMessages)
router.get("/:id/join-requests", getCommunityJoinRequestsController)
router.get("/:id/join-request/status", getJoinRequestStatus)
router.get("/:id/my-membership", checkMembershipController)

export default router