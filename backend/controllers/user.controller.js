import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUserById, putUser, getReviewsById, getNextUserById, updateAvatarService } from "../services/user.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "avatars");

export const getUserByIdController = async (req, res) => {
  const userId = req.params.id ?? req.user.id
  try {
    const result = await getUserById(userId);

    return res.status(201).json({
      success: true,
      message: "user fetched successfully",
      data: result
    })
  } catch (err) {
    console.log("message:", err.message)
    return res.status(200).json({
      success: false,
      message: "user could not be fetched!",
      data: err.message
    })
  }
}

export const putUserController = async (req, res) => {
  try {
    const {
      name,
      headline,
      bio,
      about,
      location,
      website,
      skills,
    } = req.body;

    const id = req.user.id;

    const result = await putUser(
      id,
      name,
      headline,
      bio,
      about,
      location,
      website,
      skills
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: result,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getReviewsByIdController = async (req, res) => {

  try {
    const id = req.params.id
    const { page, limit } = req.validatedQuery

    const result = await getReviewsById(id, page, limit)
    return res.status(201).json({
      success: true,
      message: "user updated successfully",
      data: result
    })


  } catch (err) {
    console.log("message:", err.message)
    return res.status(200).json({
      success: false,
      message: "user could not be updated!",
      data: err.message
    })
  }
}

// Get user by id for next user to chat.

export const getNextUserByIdController = async (req, res) => {
  const helperId = req.query.helperid
  const requesterId = req.query.requesterid
  const currentUserId = req.user?.id;

  console.log("helper id", helperId)
  console.log("requester id", requesterId)

  if (helperId == null || requesterId == null) {
    return res.status(400).json({
      success: false,
      message: "helper_id and requester_id are required",
    });
  }

  try {
    const result = await getNextUserById(helperId, requesterId, currentUserId);

    return res.status(200).json({
      success: true,
      message: "user fetched successfully",
      data: result
    });
  } catch (err) {
    console.log("message:", err.message);
    return res.status(400).json({
      success: false,
      message: "user could not be fetched!",
      data: err.message
    });
  }
}

export const updateAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    const userId = req.user.id;
    const avatar = `/uploads/avatars/${req.file.filename}`;

    const currentUser = await getUserById(userId);
    const previousAvatar = currentUser?.user?.avatar;

    if (previousAvatar && previousAvatar.startsWith("/uploads/avatars/")) {
      const previousFileName = path.basename(previousAvatar);
      const previousFilePath = path.join(uploadsDir, previousFileName);

      try {
        await fs.promises.access(previousFilePath);
        await fs.promises.unlink(previousFilePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Failed to remove previous avatar:", error.message);
        }
      }
    }

    const updatedUser = await updateAvatarService(userId, avatar);

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};