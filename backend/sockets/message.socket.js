import { pool } from "../config/db.js";

export const registerMessageEvents = (io, socket) => {

    socket.on("join-session", (sessionId) => {
        socket.join(`session-${sessionId}`);
    });

    socket.on("send-message", async ({ sessionId, content }) => {
        try {
            // Save to DB
            const { rows } = await pool.query(
                `INSERT INTO message (session_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [sessionId, socket.user.id, content]
            );

            const message = rows[0];

            // Emit to both users in that session room
            io.to(`session-${sessionId}`).emit("receive-message", message);

        } catch (err) {
            console.error(err);
        }
    });

};
