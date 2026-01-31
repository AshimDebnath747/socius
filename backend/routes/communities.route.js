import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate } from '../middlewares/validate.middleware.js';
import { createCommunitySchema } from '../validators/communities.validator.js';
import { createCommunityController, getCommunitiesController, getCommunityByIdController, joinCommunityController, leaveCommunityController } from '../controllers/communities.controller.js';
const router = express.Router()


router.use(authMiddleware)
router.post("/", validate(createCommunitySchema), createCommunityController)
router.post("/:id/join", joinCommunityController)
router.post("/:id/leave", leaveCommunityController)
router.get("/", getCommunitiesController)
router.get("/:id", getCommunityByIdController)

export default router