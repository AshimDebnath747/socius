import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate } from '../middlewares/validate.middleware.js';
import { createCommunitySchema } from '../validators/communities.validator.js';
import { createCommunityController, getCommunitiesController, getCommunityByIdController } from '../controllers/communities.controller.js';
const router = express.Router()


router.use(authMiddleware)
router.post("/", validate(createCommunitySchema), createCommunityController)
router.get("/", getCommunitiesController)
router.get("/:id", getCommunityByIdController)

export default router