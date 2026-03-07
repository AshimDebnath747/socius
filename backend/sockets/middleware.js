import jwt from "jsonwebtoken";

export const verifySocketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.user = decoded; // attach user info

        next();
    } catch (err) {
        next(new Error("Authentication failed"));
    }
};