import { signupUser, loginUser, checkAuthService } from "../services/auth.service.js";
import jwt from "jsonwebtoken";
import { onlineUsers } from "../sockets/manageOnline.js";
import { getIO } from "../sockets/index.js";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
};
export const signup = async (req, res) => {
    try {
        const result = await signupUser(req.body);

        return res.status(200).json({
            success: true,
            message: "user signed up successfully!",
            data: result
        })
    } catch (err) {
        console.log("message on signup:", err)
        return res.status(401).json({
            success: false,
            message: "user could not be registered!",
            data: err.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { token, user } = await loginUser(req.body);
        res.cookie("token", token, {
            ...cookieOptions,  // only over HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "user signed up successfully!",
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "user could not be logged in!",
            data: err.message
        })
    }
}

export const logout = (req, res) => {
    try {
        const token = req.cookies?.token;
        if (token && process.env.JWT_SECRET) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = Number(decoded.id);
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                const io = getIO();
                if (io) {
                    for (const socketId of userSockets) {
                        const s = io.sockets.sockets.get(socketId);
                        if (s) {
                            s.disconnect(true);
                        }
                    }
                    io.emit("user-status-changed", { userId, isOnline: false });
                }
                onlineUsers.delete(userId);
                console.log(`User ${userId} logged out. Sockets disconnected & marked offline.`);
            }
        }
    } catch (err) {
        console.log("Logout cleanup error:", err.message);
    }

    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

export const checkAuth = async (req, res) => {
    try {
        const token = req.cookies.token
        const result = await checkAuthService(token)
        return res.status(200).json({
            success: true,
            message: "user Authenticated successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "user could not be authenticated in!",
            data: err.message
        })
    }
}
