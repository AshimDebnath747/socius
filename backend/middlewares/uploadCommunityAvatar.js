import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads/avatars if it doesn't exist
const uploadDir = "uploads/communities";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// Allow only image files
const fileFilter = (req, file, cb) => {
  console.log("Original Name:", file.originalname);
  console.log("Extension:", path.extname(file.originalname));
  console.log("Mime Type:", file.mimetype);

  const allowedTypes = /jpeg|jpg|png|webp/;

  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  console.log("isValid:", isValid);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."));
  }
};

// Export upload middleware
export const uploadCommunityAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});