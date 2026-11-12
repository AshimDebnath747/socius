import { verifySocketAuth } from "./middleware.js";
import { registerMessageEvents } from "./message.socket.js";
import { registerSessionEvents } from "./session.socket.js";
import { onlineUsers } from "./manageOnline.js";
import { registerMeetingEvents } from "./meeting.socket.js";
let _io
export const initSocket = (io) => {
    _io = io
    // Apply auth middleware
    io.use(verifySocketAuth);

    io.on("connection", (socket) => {

        const userId = Number(socket.user.id);

        const isFirstSocket = !onlineUsers.has(userId) || onlineUsers.get(userId).size === 0;

        // Track this socket
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);
        console.log("User connected:", userId, `(Total sockets: ${onlineUsers.get(userId).size})`);

        if (isFirstSocket) {
            io.emit("user-status-changed", { userId, isOnline: true });
        }

        // Check single user status
        socket.on("check-user-status", ({ userId: targetUserId }, callback) => {
            const id = Number(targetUserId);
            const isOnline = onlineUsers.has(id) && onlineUsers.get(id).size > 0;
            if (typeof callback === "function") {
                callback({ userId: id, isOnline });
            }
        });

        // Join personal room
        socket.join(`user-${userId}`);

        // Register feature modules
        registerMessageEvents(io, socket);
        registerSessionEvents(io, socket);
        registerMeetingEvents(io, socket);
        socket.on("disconnect", (reason) => {
            console.log("Disconnected:", socket.id, reason);
            const sockets = onlineUsers.get(userId);

            if (sockets) {
                sockets.delete(socket.id);

                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit("user-status-changed", { userId, isOnline: false });
                }
            }
            console.log("User disconnected:", userId);
        });
    });

};
export const getIO = () => _io;