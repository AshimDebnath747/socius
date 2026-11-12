import { pool } from "../config/db.js";
import { sendMessage } from "../services/message.service.js";
import { onlineUsers } from "./manageOnline.js";

const meetingRoom = (sessionId) => `meeting-${sessionId}`;
const meetingJoinQueues = new Map();
const activeCalls = new Map();

const formatCallDuration = (seconds) => {
  const s = Math.round(Number(seconds) || 0);
  if (s <= 0) return "0s";
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

const recordCallHistory = async (io, {
  sessionId,
  callerId,
  receiverId,
  callMode,
  status, // "missed" | "declined" | "completed"
  duration = 0,
}) => {
  try {
    const payload = JSON.stringify({
      callMode: callMode || "voice",
      status, // "missed" | "declined" | "completed"
      duration: Number(duration) || 0,
      callerId,
      receiverId,
    });

    const { fullMessage, participants } = await sendMessage({
      type: "session",
      sessionId,
      senderId: callerId,
      content: payload,
      messageType: "call",
    });

    const room = `session-${sessionId}`;
    io.to(room).emit("receive-message", fullMessage);

    // Send notification to users online but not currently in the chat room
    for (const participant of participants) {
      const userSockets = onlineUsers.get(Number(participant.user_id));
      if (!userSockets) continue;

      let viewingRoom = false;
      for (const socketId of userSockets) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.rooms.has(room)) {
          viewingRoom = true;
          break;
        }
      }

      if (!viewingRoom) {
        let preview = "";
        const isReceiver = String(participant.user_id) === String(receiverId);
        if (status === "missed") {
          preview = isReceiver
            ? (callMode === "video" ? "📹 Missed video call" : "📞 Missed voice call")
            : (callMode === "video" ? "📹 Cancelled video call" : "📞 Outgoing voice call (No answer)");
        } else if (status === "declined") {
          preview = isReceiver
            ? (callMode === "video" ? "📹 Declined video call" : "📞 Declined voice call")
            : (callMode === "video" ? "📹 Video call declined" : "📞 Voice call declined");
        } else {
          const formattedDuration = formatCallDuration(duration);
          preview = callMode === "video"
            ? `📹 Video call (${formattedDuration})`
            : `📞 Voice call (${formattedDuration})`;
        }

        io.to(`user-${participant.user_id}`).emit("session-notification", {
          messageId: fullMessage.id,
          sessionId,
          senderName: fullMessage.name,
          preview,
        });
      }
    }
  } catch (err) {
    console.error("Failed to record call history message:", err);
  }
};

const serializeMeetingJoin = async (sessionId, join) => {
  const key = String(sessionId);
  const previous = meetingJoinQueues.get(key) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  meetingJoinQueues.set(key, current);
  await previous;
  try {
    return await join();
  } finally {
    release();
    if (meetingJoinQueues.get(key) === current) meetingJoinQueues.delete(key);
  }
};

const getSessionForParticipant = async (sessionId, userId) => {
  if (!sessionId || !Number.isInteger(Number(sessionId))) return null;
  const { rows } = await pool.query(
    `SELECT s.id, s.requester_id, s.helper_id, s.status,
            u.name AS caller_name, u.avatar AS caller_avatar
     FROM session s
     JOIN users u ON u.id = $2
     WHERE s.id = $1 AND (s.requester_id = $2 OR s.helper_id = $2)`,
    [sessionId, userId],
  );
  return rows[0] ?? null;
};

export const registerMeetingEvents = (io, socket) => {
  socket.on("join-meeting", async (sessionId, initialMediaState = {}, acknowledge = () => {}) => {
    if (typeof initialMediaState === "function") {
      acknowledge = initialMediaState;
      initialMediaState = {};
    }
    try {
      const session = await getSessionForParticipant(sessionId, socket.user.id);
      if (!session || session.status !== "active") {
        acknowledge({ success: false, message: "This active session is unavailable." });
        return;
      }

      if (socket.data.meetingSessionId && socket.data.meetingSessionId !== String(session.id)) {
        const previousRoom = meetingRoom(socket.data.meetingSessionId);
        socket.to(previousRoom).emit("user-left-meeting", { socketId: socket.id });
        socket.leave(previousRoom);
        delete socket.data.meetingSessionId;
      }

      await serializeMeetingJoin(session.id, async () => {
        const room = meetingRoom(session.id);
        socket.data.meetingMediaState = {
          micEnabled: typeof initialMediaState.micEnabled === "boolean" ? initialMediaState.micEnabled : true,
          cameraEnabled: typeof initialMediaState.cameraEnabled === "boolean" ? initialMediaState.cameraEnabled : true,
          isScreenSharing: typeof initialMediaState.isScreenSharing === "boolean" ? initialMediaState.isScreenSharing : false,
          callMode: initialMediaState.callMode || (initialMediaState.cameraEnabled ? "video" : "voice"),
        };
        const sockets = await io.in(room).fetchSockets();
        const firstParticipant = sockets.length === 0;
        const existingUsers = sockets
          .filter((participant) => String(participant.user.id) !== String(socket.user.id))
          .map((participant) => ({
            userId: participant.user.id,
            socketId: participant.id,
            ...(participant.data.meetingMediaState ?? { micEnabled: true, cameraEnabled: true, isScreenSharing: false }),
          }));

        socket.join(room);
        socket.data.meetingSessionId = String(session.id);
        socket.emit("users-already-in-meeting", existingUsers);
        socket.to(room).emit("new-user-joined", {
          userId: socket.user.id,
          socketId: socket.id,
          ...socket.data.meetingMediaState,
        });
        const otherParticipantId = String(session.requester_id) === String(socket.user.id)
          ? session.helper_id
          : session.requester_id;

        if (firstParticipant) {
          const callMode = socket.data.meetingMediaState?.callMode || (socket.data.meetingMediaState?.cameraEnabled ? "video" : "voice");

          const previousCall = activeCalls.get(String(session.id));
          if (previousCall?.timeoutTimer) clearTimeout(previousCall.timeoutTimer);

          const activeCall = {
            sessionId: session.id,
            callerId: socket.user.id,
            receiverId: otherParticipantId,
            callMode,
            status: "ringing",
            startedAt: Date.now(),
            connectedAt: null,
            timeoutTimer: null,
          };

          activeCall.timeoutTimer = setTimeout(async () => {
            const current = activeCalls.get(String(session.id));
            if (current && current.status === "ringing") {
              activeCalls.delete(String(session.id));
              io.to(`user-${current.receiverId}`).emit("call-ended", {
                sessionId: current.sessionId,
                reason: "Call timed out",
              });
              io.to(meetingRoom(current.sessionId)).emit("call-ended", {
                sessionId: current.sessionId,
                reason: "No answer",
              });
              await recordCallHistory(io, {
                sessionId: current.sessionId,
                callerId: current.callerId,
                receiverId: current.receiverId,
                callMode: current.callMode,
                status: "missed",
                duration: 0,
              });
            }
          }, 38000);

          activeCalls.set(String(session.id), activeCall);

          io.to(`user-${otherParticipantId}`).emit("incoming-meeting", {
            sessionId: session.id,
            callerId: socket.user.id,
            callerName: session.caller_name || "Help Partner",
            callerAvatar: session.caller_avatar || null,
            callMode,
          });
        } else {
          // Second participant joined: Call is answered & connected
          const activeCall = activeCalls.get(String(session.id));
          if (activeCall && activeCall.status === "ringing") {
            if (activeCall.timeoutTimer) {
              clearTimeout(activeCall.timeoutTimer);
              activeCall.timeoutTimer = null;
            }
            activeCall.status = "connected";
            activeCall.connectedAt = Date.now();
          }
        }
      });
      acknowledge({ success: true });
    } catch (error) {
      console.error("Unable to join meeting:", error);
      acknowledge({ success: false, message: "Unable to join this meeting." });
    }
  });

  socket.on("meeting-media-state", (mediaState = {}) => {
    const sessionId = socket.data.meetingSessionId;
    if (!sessionId) return;

    const currentState = socket.data.meetingMediaState ?? { micEnabled: true, cameraEnabled: true, isScreenSharing: false };
    socket.data.meetingMediaState = {
      micEnabled: typeof mediaState.micEnabled === "boolean" ? mediaState.micEnabled : currentState.micEnabled,
      cameraEnabled: typeof mediaState.cameraEnabled === "boolean" ? mediaState.cameraEnabled : currentState.cameraEnabled,
      isScreenSharing: typeof mediaState.isScreenSharing === "boolean" ? mediaState.isScreenSharing : (currentState.isScreenSharing ?? false),
    };

    socket.to(meetingRoom(sessionId)).emit("meeting-media-state", {
      socketId: socket.id,
      userId: socket.user.id,
      ...socket.data.meetingMediaState,
    });
  });

  const forwardToMeetingPeer = (event, payload, forwardedPayload) => {
    const target = io.sockets.sockets.get(payload?.targetSocketId);
    const sessionId = socket.data.meetingSessionId;
    if (!target || !sessionId || target.data.meetingSessionId !== sessionId) return;

    io.to(target.id).emit(event, {
      ...forwardedPayload,
      senderSocketId: socket.id,
    });
  };

  socket.on("webrtc-offer", ({ targetSocketId, offer } = {}) => {
    if (!offer || typeof offer !== "object") return;
    forwardToMeetingPeer("webrtc-offer", { targetSocketId }, { offer, callerSocketId: socket.id });
  });

  socket.on("webrtc-answer", ({ targetSocketId, answer } = {}) => {
    if (!answer || typeof answer !== "object") return;
    forwardToMeetingPeer("webrtc-answer", { targetSocketId }, { answer, responderSocketId: socket.id });
  });

  socket.on("ice-candidate", ({ targetSocketId, candidate } = {}) => {
    if (!candidate || typeof candidate !== "object") return;
    forwardToMeetingPeer("ice-candidate", { targetSocketId }, { candidate });
  });

  socket.on("reject-meeting", async ({ sessionId, reason } = {}) => {
    if (!sessionId) return;
    const session = await getSessionForParticipant(sessionId, socket.user.id);
    if (!session) return;
    const room = meetingRoom(session.id);
    io.to(room).emit("call-rejected", {
      sessionId: session.id,
      rejectedBy: socket.user.id,
    });

    const activeCall = activeCalls.get(String(session.id));
    if (activeCall && activeCall.status === "ringing") {
      activeCalls.delete(String(session.id));
      if (activeCall.timeoutTimer) clearTimeout(activeCall.timeoutTimer);

      const status = reason === "timeout" ? "missed" : "declined";
      await recordCallHistory(io, {
        sessionId: session.id,
        callerId: activeCall.callerId,
        receiverId: activeCall.receiverId,
        callMode: activeCall.callMode,
        status,
        duration: 0,
      });
    }
  });

  const leaveMeeting = async () => {
    const sessionId = socket.data.meetingSessionId;
    if (!sessionId) return;
    const room = meetingRoom(sessionId);
    socket.to(room).emit("user-left-meeting", { socketId: socket.id });
    socket.leave(room);
    delete socket.data.meetingSessionId;

    const activeCall = activeCalls.get(String(sessionId));
    if (activeCall) {
      if (activeCall.status === "ringing") {
        // Caller cut before the other person picked it up!
        activeCalls.delete(String(sessionId));
        if (activeCall.timeoutTimer) clearTimeout(activeCall.timeoutTimer);

        // Cancel the ringing notification on the other person's side!
        io.to(`user-${activeCall.receiverId}`).emit("call-ended", {
          sessionId,
          endedBy: socket.user.id,
          reason: "Caller cancelled",
        });
        io.to(room).emit("call-ended", {
          sessionId,
          endedBy: socket.user.id,
          reason: "Caller cancelled",
        });

        // Record missed call in chat
        await recordCallHistory(io, {
          sessionId,
          callerId: activeCall.callerId,
          receiverId: activeCall.receiverId,
          callMode: activeCall.callMode,
          status: "missed",
          duration: 0,
        });
      } else if (activeCall.status === "connected") {
        // Someone left a connected call
        activeCalls.delete(String(sessionId));
        if (activeCall.timeoutTimer) clearTimeout(activeCall.timeoutTimer);

        const duration = Math.max(1, Math.round((Date.now() - (activeCall.connectedAt || Date.now())) / 1000));

        io.to(room).emit("call-ended", {
          sessionId,
          endedBy: socket.user.id,
          reason: "Participant ended the call",
          duration,
        });
        io.to(`user-${activeCall.callerId}`).emit("call-ended", { sessionId, duration });
        io.to(`user-${activeCall.receiverId}`).emit("call-ended", { sessionId, duration });

        await recordCallHistory(io, {
          sessionId,
          callerId: activeCall.callerId,
          receiverId: activeCall.receiverId,
          callMode: activeCall.callMode,
          status: "completed",
          duration,
        });
      }
    } else {
      socket.to(room).emit("call-ended", {
        sessionId,
        endedBy: socket.user.id,
        reason: "Participant ended the call",
      });
    }
  };

  socket.on("leave-meeting", leaveMeeting);
  socket.on("disconnecting", leaveMeeting);
};
