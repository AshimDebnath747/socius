import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate } from '../middlewares/validate.middleware.js';
import { createCommunitySchema } from '../validators/communities.validator.js';
import { createCommunityController } from '../controllers/communities.controller.js';
const router = express.Router()


//router.use(authMiddleware)
router.post("/", validate(createCommunitySchema), createCommunityController)


export default router