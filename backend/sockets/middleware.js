import jwt from "jsonwebtoken";

export const verifySocketAuth = (socket, next) => {
    // cookie-parser already parses cookies onto handshake
    console.log("ALL HANDSHAKE:", socket.handshake);
    console.log("RAW COOKIE HEADER:", socket.handshake.headers.cookie);
    const token = socket.handshake.headers.cookie
        ?.split(";")
        .find(c => c.trim().startsWith("token="))
        ?.split("=")[1];

    console.log("token:", token);

    if (!token) return next(new Error("Unauthorized"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
};