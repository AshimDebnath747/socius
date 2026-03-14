import express from 'express';
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { updateUserSchema, getReviewsValidation } from '../validators/user.validator.js';
import { getUserByIdController, putUserController, getReviewsByIdController } from "../controllers/user.controller.js"
const router = express.Router()


router.use(authMiddleware)

//get requests
router.get("/:id", validate(updateUserSchema), getUserByIdController)
router.get("/:id/reviews", validateQuery(getReviewsValidation), getReviewsByIdController)

//put requests
router.put("/me", putUserController)

export default router