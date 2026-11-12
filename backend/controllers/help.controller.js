import {
  postHelpRequest,
  getHelpRequest,
  getHelpRequestById,
  closeHelpRequest,
} from "../services/help.service.js";

export const postHelpRequestController = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      urgency,
      preferredMode,
      communityId,
    } = req.body;

    const userId = req.user.id;

    // Image path saved by Multer
    const image = req.file ? `/uploads/help-requests/${req.file.filename}` : null;
    const result = await postHelpRequest(
      title,
      description,
      categoryId ?? null,
      urgency,
      preferredMode,
      communityId ?? null,
      userId,
      image,
    );

    return res.status(201).json({
      success: true,
      message: "Help request uploaded successfully!",
      data: result,
    });
  } catch (err) {
    console.error("Error creating help request:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Help request could not be uploaded!",
      data: err.message,
    });
  }
};

export const getHelpRequestController = async (req, res) => {
  try {
    const { communityId, status } = req.validatedQuery;
    console.log(typeof communityId);
    const result = await getHelpRequest(communityId, status);

    res.status(200).json({
      success: true,
      message: "Help request fetched successfully!",
      data: result,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "help request can not be fetched!",
      data: err.message,
    });
  }
};

export const getHelpRequestByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getHelpRequestById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Help request not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Help request by ID fetched successfully!",
      data: result,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || "Help request by ID could not be fetched",
      data: null,
    });
  }
};

export const closeHelpRequestController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await closeHelpRequest(id);
    res.status(200).json({
      success: true,
      message: "Help request updated successfully!",
      data: result,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "help request can not be updated!",
      data: err.message,
    });
  }
};
