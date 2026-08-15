import multer from "multer";
import path from "path";
import fs from "fs";

export const createUploader = (
    folderName,
    allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxFileSize = 25 * 1024 * 1024
) => {
    const uploadDir = `uploads/${folderName}`;

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

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

    const fileFilter = (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    `Unsupported file type: ${file.mimetype}`
                )
            );
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxFileSize,
        },
    });
};


// Existing uploaders
export const uploadAvatar = createUploader("avatars");

export const uploadHelpRequest = createUploader("help-requests");


// Chat media
export const uploadChatMedia = createUploader(
    "chat-media",
    [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",

        // Videos
        "video/mp4",
        "video/webm",
    ],
    50 * 1024 * 1024
);