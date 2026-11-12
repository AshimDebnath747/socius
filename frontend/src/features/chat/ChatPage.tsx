import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { Box, Button, IconButton, Typography } from "@mui/material";
import SessionSidebar from "./components/SessionSidebar";
import { useEffect, useState } from "react";
import type { Session } from "../../types/session";
import { getNextUserById } from "../../services/user.service";
import { io } from "socket.io-client";
import { type Message } from "./types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
const API = import.meta.env.VITE_BACKEND_URL;
const socket = io(API, {
  withCredentials: true,
});
const user: string | null = localStorage.getItem("user");
console.log("user :", user);
let CURRENT_USER_ID: string = "";
if (user) CURRENT_USER_ID = String(JSON.parse(user).id);
console.log(CURRENT_USER_ID);

const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const connected = true;

  const loading = false;

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.senderId !== CURRENT_USER_ID && !msg.isRead) {
        socket.emit("message-read", {
          messageId: msg.id,
        });
      }
    });
  }, [messages]);

  useEffect(() => {
    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      console.log("message read event hit on message id", messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === String(messageId)
            ? {
                ...msg,
                isRead: true,
              }
            : msg,
        ),
      );
    };

    socket.on("message-read", handleMessageRead);

    return () => {
      socket.off("message-read", handleMessageRead);
    };
  }, []);
  useEffect(() => {
    const handleDelivered = ({ messageId }: { messageId: string }) => {
      console.log("message delivered event hit on message id", messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId)
            ? {
                ...msg,
                isDelivered: true,
              }
            : msg,
        ),
      );
    };

    socket.on("message-delivered", handleDelivered);

    return () => {
      socket.off("message-delivered", handleDelivered);
    };
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (msg: any) => {
      const message: Message = {
        id: String(msg.id),
        sessionId: String(msg.session_id),
        senderId: String(msg.sender_id),
        content: msg.content,

        messageType: msg.message_type || "text",

        mediaUrl: msg.media_url || undefined,
        mediaName: msg.media_name || undefined,
        mediaMimeType: msg.media_mime_type || undefined,
        mediaSize: msg.media_size ? Number(msg.media_size) : undefined,

        createdAt: msg.created_at,
        isDelivered: msg.is_delivered,
        isRead: msg.is_read,
      };

      console.log(message.createdAt);
      console.log(typeof message.createdAt);
      // console.log(message.createdAt instanceof Date);
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== CURRENT_USER_ID) {
        socket.emit("message-delivered", {
          messageId: message.id,
        });
      }
    };
    socket.on("receive-message", handleReceiveMessage);
    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);
  // Function to handle session selection

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (!selectedSession) return;
        console.log("selected session:", selectedSession.id);

        const msg = await axios.get(
          `${API}/api/sessions/${selectedSession.id}/messages`,
          {
            withCredentials: true,
          },
        );

        console.log(msg.data);
        const messages: Message[] = msg.data?.data?.map((msg: any) => ({
          id: String(msg.id),
          sessionId: String(msg.session_id),
          senderId: String(msg.sender_id),
          content: msg.content,

          messageType: msg.message_type || "text",

          mediaUrl: msg.media_url || undefined,
          mediaName: msg.media_name || undefined,
          mediaMimeType: msg.media_mime_type || undefined,
          mediaSize: msg.media_size ? Number(msg.media_size) : undefined,

          createdAt: msg.created_at,
          isRead: msg.is_read,
          isDelivered: msg.is_delivered,
        }));

        setMessages(messages);
        socket.emit("join-session", selectedSession.id);
        const res = await getNextUserById(
          selectedSession.helper_id,
          selectedSession.requester_id,
        );
        setChatUser(res);
        console.log("Fetched user:", res);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSessions();
  }, [selectedSession]);

  const handleSendMedia = async (file: File, caption: string) => {
    if (!selectedSession) return;

    try {
      const formData = new FormData();

      formData.append("media", file);

      const response = await axios.post(
        `${API}/api/sessions/${selectedSession.id}/media`,
        formData,
        {
          withCredentials: true,
        },
      );

      console.log("Media upload response:", response.data);

      const media = response.data?.data;

      if (!media?.mediaUrl) {
        throw new Error("Media URL was not returned by the server");
      }

      socket.emit("send-message", {
        type: "session",

        sessionId: selectedSession.id,

        content: caption,

        messageType: media.messageType,

        mediaUrl: media.mediaUrl,

        mediaName: media.mediaName,

        mediaMimeType: media.mediaMimeType,

        mediaSize: media.mediaSize,
      });

      console.log("Media message sent successfully");
    } catch (error) {
      console.error("Failed to send media:", error);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        height: { xs: "calc(100dvh - 124px - env(safe-area-inset-bottom))", md: "calc(100vh - 68px)" },
        bgcolor: "background.default",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: { xs: selectedSession ? "none" : "flex", md: "flex" }, width: { xs: "100%", md: 340 }, flexShrink: 0 }}>
        <SessionSidebar onSelectSession={setSelectedSession} selectedSessionId={selectedSession?.id} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
          ...(selectedSession ? {} : { display: { xs: "none", md: "flex" } }),
        }}
      >
        {selectedSession ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", pr: { xs: 1, sm: 2 } }}>
              <IconButton onClick={() => setSelectedSession(null)} aria-label="Back to conversations" sx={{ display: { xs: "inline-flex", md: "none" }, ml: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ChatHeader
                  otherUser={{
                    name: chatUser?.name || "Loading...",
                    role: chatUser?.role || "Loading...",
                    avatarUrl: chatUser?.avatar,
                  }}
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<VideoCallIcon />}
                disabled={selectedSession.status !== "active" || selectedSession.mode !== "call"}
                onClick={() => navigate(`/meeting/${selectedSession.id}`)}
                sx={{ flexShrink: 0, ml: 1, px: { xs: 1.25, sm: 2 }, fontSize: { xs: 12, sm: 14 } }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Start video call</Box>
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Call</Box>
              </Button>
            </Box>

            <ChatWindow
              messages={messages}
              loading={loading}
              currentUserId={CURRENT_USER_ID}
            />

            <MessageInput
              onSend={(content) => {
                if (!selectedSession) return;

                socket.emit("send-message", {
                  type: "session",
                  sessionId: selectedSession.id,
                  content,
                });
              }}
              onSendMedia={handleSendMedia}
              disabled={!connected}
            />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
            }}
          >
            <Typography variant="h6" color="text.secondary">Select a conversation to view messages</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;
