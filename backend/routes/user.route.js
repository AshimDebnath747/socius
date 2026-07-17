import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import {
  updateUserSchema,
  getReviewsValidation,
} from "../validators/user.validator.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import {
  getUserByIdController,
  putUserController,
  getReviewsByIdController,
  getNextUserByIdController,
  updateAvatarController,
} from "../controllers/user.controller.js";
import { getNextUserById } from "../services/user.service.js";
const router = express.Router();

router.use(authMiddleware);

//get requests
router.get("/", getUserByIdController);
//router.get("/:id", getUserByIdController);

router.patch("/avatar", uploadAvatar.single("avatar"), updateAvatarController);

router.get(
  "/:id/reviews",
  validateQuery(getReviewsValidation),
  getReviewsByIdController,
);
router.get("/next", getNextUserByIdController);
//put requests
router.put("/me", putUserController);

export default router;
