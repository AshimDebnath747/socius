import { pool } from "../config/db.js";
import { sendMessage } from "../services/message.service.js";
import { onlineUsers } from "./manageOnline.js";
export const registerMessageEvents = (io, socket) => {
  socket.on("join-session", (sessionId) => {
    console.log(`joined session-${sessionId}`);
    for (const room of socket.rooms) {
      if (room.startsWith("session-")) {
        socket.leave(room);
      }
    }
    socket.join(`session-${sessionId}`);
  });
  socket.on("join-community", (sessionId) => {
    console.log(`joined community-${sessionId}`);
    for (const room of socket.rooms) {
      if (room.startsWith("community-")) {
        socket.leave(room);
      }
    }
    socket.join(`community-${sessionId}`);
  });

  // Typing indicators ->
  socket.on("typing", ({ type, targetId, userName }) => {
    if (!targetId) return;
    const room =
      type === "community"
        ? `community-${targetId}`
        : `session-${targetId}`;

    socket.to(room).emit("user-typing", {
      type,
      targetId: String(targetId),
      userId: String(socket.user.id),
      userName: userName || "Someone",
    });
  });

  socket.on("stop-typing", ({ type, targetId }) => {
    if (!targetId) return;
    const room =
      type === "community"
        ? `community-${targetId}`
        : `session-${targetId}`;

    socket.to(room).emit("user-stop-typing", {
      type,
      targetId: String(targetId),
      userId: String(socket.user.id),
    });
  });

  //message - read ->
  socket.on("message-read", async ({ messageId }) => {
    const result = await pool.query(
      `
        UPDATE message_status
        SET read_at = NOW()
        WHERE message_id = $1
          AND user_id = $2
          AND read_at IS NULL
        `,
      [messageId, socket.user.id],
    );
    if (result.rowCount === 0) {
      return; // Already marked as read, ignore duplicate emits
    }
    console.log("message read ", messageId, "by", socket.user.id);
    const { rows } = await pool.query(
      `
        SELECT COUNT(*) > 0 AND COUNT(*) = COUNT(read_at) AS everyone_read
        FROM message_status
        WHERE message_id = $1
        `,
      [messageId],
    );

    if (!rows[0] || !rows[0].everyone_read) {
      return;
    }

    const { rows: senderRows } = await pool.query(
      `
        SELECT sender_id
        FROM messages
        WHERE id = $1
        `,
      [messageId],
    );

    if (senderRows.length > 0 && senderRows[0].sender_id) {
      io.to(`user-${senderRows[0].sender_id}`).emit("message-read", {
        messageId,
      });
    }
  });
  //message - delivered ->
  socket.on("message-delivered", async ({ messageId }) => {
    // Mark as delivered for this recipient
    console.log("message delivered!", messageId, "to: ", socket.user.id);
    await pool.query(
      `
        UPDATE message_status
        SET delivered_at = NOW()
        WHERE message_id = $1
          AND user_id = $2
        `,
      [messageId, socket.user.id],
    );

    // Find the conversation this message belongs to
    const { rows } = await pool.query(
      `
        SELECT
            COUNT(*) > 0 AND COUNT(*) = COUNT(delivered_at) AS everyone_delivered
        FROM message_status
        WHERE message_id = $1
        `,
      [messageId],
    );

    if (!rows[0] || !rows[0].everyone_delivered) {
      return;
    }

    const { rows: senderRows } = await pool.query(
      `
        SELECT sender_id
        FROM messages
        WHERE id = $1
        `,
      [messageId],
    );
    if (senderRows.length > 0 && senderRows[0].sender_id) {
      const senderId = senderRows[0].sender_id;
      console.log(senderId);

      io.to(`user-${senderId}`).emit("message-delivered", {
        messageId,
      });
    }
  });
  //send-message ->
  socket.on(
    "send-message",
    async ({
      type,
      sessionId,
      content,
      messageType = "text",
      mediaUrl = null,
      mediaName = null,
      mediaMimeType = null,
      mediaSize = null,
    }) => {
      try {
        if (type === "community") {
          const { rows } = await pool.query(
            `SELECT *
                 FROM communitymember
                 WHERE community_id = $1
                 AND user_id = $2`,
            [sessionId, socket.user.id],
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
            [sessionId, socket.user.id],
          );

          if (!rows.length) {
            return socket.emit("error", {
              message: "Unauthorized",
            });
          }
        }

        const { fullMessage, participants } =
    await sendMessage({
        type,

        senderId: socket.user.id,

        content,

        sessionId:
            type === "session"
                ? sessionId
                : null,

        communityId:
            type === "community"
                ? sessionId
                : null,

        messageType,
        mediaUrl,
        mediaName,
        mediaMimeType,
        mediaSize,
    });
        console.log("the community memebers are ", participants);

        const room =
          type === "community"
            ? `community-${sessionId}`
            : `session-${sessionId}`;

        for (const participant of participants) {
          const userSockets = onlineUsers.get(Number(participant.user_id));

          // User is offline
          if (!userSockets) {
            console.log(participant.user_id, " is offline");
            continue;
          }

          let viewingRoom = false;

          // Check whether any of the user's sockets is in this community
          for (const socketId of userSockets) {
            const s = io.sockets.sockets.get(socketId);

            if (s && s.rooms.has(room)) {
              viewingRoom = true;
              break;
            }
          }

          if (viewingRoom) {
            console.log(participant.user_id, " is viewing room!");

            // User is currently viewing this community
          } else {
            console.log(
              participant.user_id,
              " is online but not viewing room!",
            );
            console.log(
              "Sending notification to",
              `user-${participant.user_id}`,
            );
            const event =
              type === "community"
                ? "community-notification"
                : "session-notification";

            // User is online but somewhere else
            const room = `user-${participant.user_id}`;

            console.log(room, io.sockets.adapter.rooms.get(room));
            let notificationPreview = "Sent a message";
            if (fullMessage.message_type === "image" || (fullMessage.media_mime_type && fullMessage.media_mime_type.startsWith("image/"))) {
              notificationPreview = "Sent a photo";
            } else if (fullMessage.message_type === "video" || (fullMessage.media_mime_type && fullMessage.media_mime_type.startsWith("video/"))) {
              notificationPreview = "Sent a video";
            } else if (fullMessage.message_type && fullMessage.message_type !== "text") {
              notificationPreview = "Sent an attachment";
            } else if (type === "community") {
              notificationPreview = fullMessage.content || "Sent a message";
            }

            io.to(`user-${participant.user_id}`).emit(event, {
              messageId: fullMessage.id,
              sessionId,
              senderName: fullMessage.name,
              //communityName, // fetch this if needed
              preview: notificationPreview,
            });
          }
        }
        console.log("room ", room);
        console.log("on receive", fullMessage);
        io.to(room).emit("receive-message", fullMessage);
      } catch (err) {
        console.error(err);
        socket.emit("error", {
          message: "Failed to send message",
        });
      }
    },
  );
};
