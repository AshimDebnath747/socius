import { verifySocketAuth } from "./middleware.js";
import { registerMessageEvents } from "./message.socket.js";
import { registerSessionEvents } from "./session.socket.js";
import { onlineUsers } from "./manageOnline.js";
let _io
export const initSocket = (io) => {
    _io = io
    // Apply auth middleware
    io.use(verifySocketAuth);

    io.on("connection", (socket) => {

        const userId = socket.user.id;

        const sockets = onlineUsers.get(userId);
        console.log(
            `User ${userId} has ${sockets?.size ?? 0} socket(s)`
        );

        // Track this socket
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);
        console.log("User connected:", userId);

        // Join personal room
        socket.join(`user-${userId}`);

        // Register feature modules
        registerMessageEvents(io, socket);
        registerSessionEvents(io, socket);

        socket.on("disconnect", (reason) => {
            console.log("Disconnected:", socket.id, reason);
            const sockets = onlineUsers.get(userId);

            if (sockets) {
                sockets.delete(socket.id);

                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                }
            }
            console.log("User disconnected:", userId);
        });
    });

};
export const getIO = () => _io;