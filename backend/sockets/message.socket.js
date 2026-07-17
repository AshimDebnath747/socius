import { pool } from "../config/db.js";
import { sendMessage } from "../services/message.service.js";
import { onlineUsers } from "./manageOnline.js";
export const registerMessageEvents = (io, socket) => {

    socket.on("join-session", (sessionId) => {
        console.log(`joined session-${sessionId}`)
        socket.join(`session-${sessionId}`);
    });
    socket.on("join-community", (sessionId) => {
        console.log(`joined community-${sessionId}`)
        for (const room of socket.rooms) {
            if (room.startsWith("community-")) {
                socket.leave(room);
            }
        }
        socket.join(`community-${sessionId}`);
    });
    //message - delivered ->
    socket.on("message-delivered", async ({ messageId }) => {
        // Mark as delivered for this recipient
        console.log("message delivered!", messageId, "to: ", socket.user.id)
        await pool.query(
            `
        UPDATE message_status
        SET delivered_at = NOW()
        WHERE message_id = $1
          AND user_id = $2
        `,
            [messageId, socket.user.id]
        );

        // Find the conversation this message belongs to
        const { rows } = await pool.query(
            `
        SELECT
            COUNT(*) = COUNT(delivered_at) AS everyone_delivered
        FROM message_status
        WHERE message_id = $1
        `,
            [messageId]
        );

        if (!rows[0].everyone_delivered) {
            return;
        }

        const { rows: senderRows } = await pool.query(
            `
        SELECT sender_id
        FROM messages
        WHERE id = $1
        `,
            [messageId]
        );
        const senderId = senderRows[0].sender_id;

        io.to(`user-${senderId}`).emit(
            "message-delivered",
            {
                messageId,
            }
        );
    });
    //send-message ->
    socket.on("send-message", async ({ type, sessionId, content }) => {
        try {
            if (type === "community") {
                const { rows } = await pool.query(
                    `SELECT *
                 FROM communitymember
                 WHERE community_id = $1
                 AND user_id = $2`,
                    [sessionId, socket.user.id]
                );

                if (!rows.length) {
                    return socket.emit("error", {
                        message: "Unauthorized",
                    });
                }
            } else {
                const { rows } = await pool.query(
                    `SELECT *
                 FROM session
                 WHERE id = $1
                 AND (requester_id = $2 OR helper_id = $2)
                 AND status = 'active'`,
                    [sessionId, socket.user.id]
                );

                if (!rows.length) {
                    return socket.emit("error", {
                        message: "Unauthorized",
                    });
                }
            }

            const { fullMessage, participants } = await sendMessage({
                type,
                senderId: socket.user.id,
                content,
                sessionId: type === "session" ? sessionId : null,
                communityId: type === "community" ? sessionId : null,
            });
            console.log("the community memebers are ", participants)
            for (const participant of participants) {

                const userSockets = onlineUsers.get(participant.user_id);

                // User is offline
                if (!userSockets) {
                    console.log(participant.user_id, " is offline")
                    continue;
                }

                let viewingCommunity = false;

                // Check whether any of the user's sockets is in this community
                for (const socketId of userSockets) {

                    const s = io.sockets.sockets.get(socketId);

                    if (s && s.rooms.has(`community-${sessionId}`)) {
                        viewingCommunity = true;
                        break;
                    }
                }

                if (viewingCommunity) {
                    console.log(participant.user_id, " is viewing community!")

                    // User is currently viewing this community

                } else {
                    console.log(participant.user_id, " is online but not viewing community!")

                    // User is online but somewhere else
                    io.to(`user-${participant.user_id}`).emit(
                        "community-notification",
                        {
                            messageId: fullMessage.id,
                            sessionId,
                            senderName: fullMessage.name,
                            //communityName, // fetch this if needed
                            preview: fullMessage.content,
                        }
                    );

                }
            }
            const room =
                type === "community"
                    ? `community-${sessionId}`
                    : `session-${sessionId}`;
            console.log("room ", room)
            console.log("on receive", fullMessage)
            io.to(room).emit("receive-message", fullMessage);
        } catch (err) {
            console.error(err);
            socket.emit("error", {
                message: "Failed to send message",
            });
        }
    });

};
