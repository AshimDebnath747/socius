import { pool } from "../config/db.js";

export const registerMessageEvents = (io, socket) => {

    socket.on("join-session", (sessionId) => {
        console.log(`session-${sessionId}`)
        socket.join(`session-${sessionId}`);
    });

    socket.on("send-message", async ({ sessionId, content }) => {
        try {
            // Save to DB
            console.log("sessionId:", sessionId);  // ← check this
            console.log("content:", content);
            const { rows: sessionRows } = await pool.query(
                `SELECT * FROM session 
             WHERE id = $1 
             AND (requester_id = $2 OR helper_id = $2)
             AND status = 'active'`,
                [sessionId, socket.user.id]
            );

            if (!sessionRows[0]) {
                return socket.emit("error", { message: "Unauthorized" });
            }

            const { rows } = await pool.query(
                `INSERT INTO messages (session_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [sessionId, socket.user.id, content]
            );

            const message = rows[0];
            console.log(message)
            // Emit to both users in that session room
            io.to(`session-${sessionId}`).emit("receive-message", message);

        } catch (err) {
            console.error(err);
        }
    });

};
