import { verifySocketAuth } from "./middleware.js";
import { registerMessageEvents } from "./message.socket.js";
import { registerSessionEvents } from "./session.socket.js";
let _io
export const initSocket = (io) => {
    _io = io
    // Apply auth middleware
    io.use(verifySocketAuth);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.user.id);

        // Join personal room
        socket.join(`user-${socket.user.id}`);

        // Register feature modules
        registerMessageEvents(io, socket);
        registerSessionEvents(io, socket);

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user.id);
        });
    });

};
export const getIO = () => _io;