export const registerSessionEvents = (io, socket) => {
    socket.on("session-accepted", ({ sessionId, requesterId }) => {
        // Notify requester
        io.to(`user-${requesterId}`).emit("new-chat", {
            sessionId,
            helperId: socket.user.id,
        });
    });

    socket.on("end-session", ({ sessionId }) => {
        io.to(`session-${sessionId}`).emit("session-ended", {
            sessionId: Number(sessionId),
        });
        io.to(`meeting-${sessionId}`).emit("session-ended", {
            sessionId: Number(sessionId),
        });
    });
};