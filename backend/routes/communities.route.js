import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate } from '../middlewares/validate.middleware.js';
import { createCommunitySchema } from '../validators/communities.validator.js';
import { createCommunityController, getCommunitiesController, getCommunityBySlugController, joinCommunityController, leaveCommunityController, getAllCommunityMembersController, changeRoleController, getComminityMessages, getAllCommunitiesController } from '../controllers/communities.controller.js';
const router = express.Router()

//middleware
router.use(authMiddleware)
//post requests:
router.post("/", validate(createCommunitySchema), createCommunityController)
router.post("/:id/join", joinCommunityController)
router.post("/:id/leave", leaveCommunityController)

//put requests:
router.put("/:id/members/:userId/role", changeRoleController)

//get requests:
router.get("/", getCommunitiesController)
router.get("/all", getAllCommunitiesController)
router.get("/:slug", getCommunityBySlugController)
router.get("/:id/members", getAllCommunityMembersController)
router.get("/:id/messages", getComminityMessages)

export default router