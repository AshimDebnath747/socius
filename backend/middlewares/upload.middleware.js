import multer from "multer";
import path from "path";
import fs from "fs";

export const createUploader = (folderName) => {
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
        const allowedTypes = /jpeg|jpg|png|webp/;

        const isValid =
            allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
            allowedTypes.test(file.mimetype);

        if (isValid) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed."));
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 25 * 1024 * 1024,
        },
    });
};

export const uploadAvatar = createUploader("avatars");
export const uploadHelpRequest = createUploader("help-requests");