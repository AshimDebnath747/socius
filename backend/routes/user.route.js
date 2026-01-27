import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate } from '../middlewares/validate.middleware.js';
import { updateUserSchema } from '../validators/user.validator.js';
import { getUserByIdController, putUserController } from "../controllers/user.controller.js"
const router = express.Router()


//router.use(authMiddleware)
router.get("/:id", validate(updateUserSchema), getUserByIdController)
router.put("/me", putUserController)

export default router