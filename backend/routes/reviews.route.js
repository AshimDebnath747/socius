import express from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { reviewPostValidation } from "../validators/review.validator.js"
import { reviewPostController } from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';


const router = express.Router()

router.use(authMiddleware)

//post requests ->>>
router.post("/", validate(reviewPostValidation), reviewPostController)

export default router