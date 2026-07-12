import { getUserById, putUser, getReviewsById, getNextUserById, updateAvatarService } from "../services/user.service.js";

export const getUserByIdController = async (req, res) => {
    const userId  = req.params.id ?? req.user.id
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
    const { helper_id, requester_id } = req.body;
    const currentUserId = req.user?.id;

    if (helper_id == null || requester_id == null) {
        return res.status(400).json({
            success: false,
            message: "helper_id and requester_id are required",
        });
    }

    try {
        const result = await getNextUserById(helper_id, requester_id, currentUserId);

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
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // Logged-in user's ID (set by authenticate middleware)
    const userId = req.user.id;

    // Store the relative path in the database
    const avatar = `/uploads/avatars/${req.file.filename}`;

    // Update the user's avatar
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