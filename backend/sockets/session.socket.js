export const registerSessionEvents = (io, socket) => {

    socket.on("session-accepted", ({ sessionId, requesterId }) => {

        // Notify requester
        io.to(`user-${requesterId}`).emit("new-chat", {
            sessionId,
            helperId: socket.user.id
        });

    });

};