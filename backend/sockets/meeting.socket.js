import { pool } from "../config/db.js";

const meetingRoom = (sessionId) => `meeting-${sessionId}`;
const meetingJoinQueues = new Map();

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
    `SELECT id, requester_id, helper_id, status
     FROM session
     WHERE id = $1 AND (requester_id = $2 OR helper_id = $2)`,
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
        };
        const sockets = await io.in(room).fetchSockets();
        const firstParticipant = sockets.length === 0;
        const existingUsers = sockets
          .filter((participant) => String(participant.user.id) !== String(socket.user.id))
          .map((participant) => ({
            userId: participant.user.id,
            socketId: participant.id,
            ...(participant.data.meetingMediaState ?? { micEnabled: true, cameraEnabled: true }),
          }));

        socket.join(room);
        socket.data.meetingSessionId = String(session.id);
        socket.emit("users-already-in-meeting", existingUsers);
        socket.to(room).emit("new-user-joined", {
          userId: socket.user.id,
          socketId: socket.id,
          ...socket.data.meetingMediaState,
        });
        if (firstParticipant) {
          const otherParticipantId = String(session.requester_id) === String(socket.user.id)
            ? session.helper_id
            : session.requester_id;
          io.to(`user-${otherParticipantId}`).emit("incoming-meeting", {
            sessionId: session.id,
            callerId: socket.user.id,
          });
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

    const currentState = socket.data.meetingMediaState ?? { micEnabled: true, cameraEnabled: true };
    socket.data.meetingMediaState = {
      micEnabled: typeof mediaState.micEnabled === "boolean" ? mediaState.micEnabled : currentState.micEnabled,
      cameraEnabled: typeof mediaState.cameraEnabled === "boolean" ? mediaState.cameraEnabled : currentState.cameraEnabled,
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

  const leaveMeeting = () => {
    const sessionId = socket.data.meetingSessionId;
    if (!sessionId) return;
    const room = meetingRoom(sessionId);
    socket.to(room).emit("user-left-meeting", { socketId: socket.id });
    socket.leave(room);
    delete socket.data.meetingSessionId;
  };

  socket.on("leave-meeting", leaveMeeting);
  socket.on("disconnecting", leaveMeeting);
};
