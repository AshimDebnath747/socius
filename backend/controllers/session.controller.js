import { helpRequestAccept, getSessionById, endSessionById, cancelSessionById, getMessages, getAllSessions } from "../services/session.service.js"
import fs from "fs";
import path from "path";
import { pool } from "../config/db.js";
import { getIO } from "../sockets/index.js"

export const helpRequestAcceptController = async (req, res) => {

    try {
        const { helpRequestId, mode } = req.body
        const helperId = req.user.id

        const session = await helpRequestAccept(helpRequestId, helperId, mode)
        const io = getIO();
        const RequesterId = session.requester_id
        io.to(`user-${session.requester_id}`).emit("join-session", session.id);
        io.to(`user-${session.helper_id}`).emit("join-session", session.id);
        io.to(`user-${RequesterId}`).emit("new-chat", {
            sessionId: session.id,
            helperId: req.user.id,
        });
        return res.status(201).json({
            success: true,
            message: "session created successfully",
            data: session
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be created!",
            data: err.message
        })
    }
}

export const getSessionByIdController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await getSessionById(id)
        return res.status(200).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })

    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })
    }
}

export const endSessionByIdController = async (req, res) => {
    try {
        const { id } = req.params

        const result = await endSessionById(id)

        return res.status(201).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })


    } catch (err) {

        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })

    }
}

export const cancelSessionByIdController = async (req, res) => {
    try {

        const { id } = req.params

        const result = await cancelSessionById(id)
        return res.status(200).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })


    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })
    }
}

export const getMessagesController = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id

        const result = await getMessages(id, userId)
        return res.status(200).json({
            success: true,
            message: "session fetched successfully",
            data: result
        })



    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "session could not be fetched!",
            data: err.message
        })
    }
}

export const getAllSessionsController = async (req, res) => {
    try {
        const userId = req.user.id

        const result = await getAllSessions(userId)
        return res.status(200).json({
            success: true,
            message: "sessions fetched successfully",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "sessions could not be fetched!",
            data: err.message
        })
    }

}

// session media uploading

export const uploadSessionMediaController = async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const userId = req.user.id;

        // No file uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a media file.",
            });
        }

        // Check whether the user belongs to this session
        const { rows } = await pool.query(
            `
            SELECT id
            FROM session
            WHERE id = $1
            AND (requester_id = $2 OR helper_id = $2)
            `,
            [sessionId, userId]
        );

        if (!rows.length) {
            // Remove the file because Multer already saved it
            await fs.promises.unlink(req.file.path).catch(() => {});

            return res.status(403).json({
                success: false,
                message: "You are not a participant of this session.",
            });
        }

        const mediaUrl = `/uploads/chat-media/${req.file.filename}`;

        let messageType = "file";

        if (req.file.mimetype.startsWith("image/")) {
            messageType = "image";
        } else if (req.file.mimetype.startsWith("video/")) {
            messageType = "video";
        }

        return res.status(201).json({
            success: true,
            message: "Media uploaded successfully.",
            data: {
                mediaUrl,
                mediaName: req.file.originalname,
                mediaMimeType: req.file.mimetype,
                mediaSize: req.file.size,
                messageType,
            },
        });

    } catch (error) {
        console.error("Media upload error:", error);

        // If something failed after Multer saved the file,
        // clean it up.
        if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }

        return res.status(500).json({
            success: false,
            message: "Failed to upload media.",
        });
    }
};