import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import SessionSidebar from "./components/SessionSidebar";
import { useEffect, useRef, useState } from "react";
import type { Session } from "../../types/session";
import { getNextUserById } from "../../services/user.service";
import { endSession } from "../../services/session.service";
import { socket } from "../../socket";
import { type Message } from "./types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  getLocalPrivateKey,
  deriveSessionKey,
  encryptChatMessage,
  decryptChatMessage,
  fetchUserPublicKey,
  initializeUserCryptoKeys,
} from "../../lib/crypto";

const API = import.meta.env.VITE_BACKEND_URL;

const getStoredUserId = (): string => {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return String(parsed.id || "");
    }
  } catch {
    // ignore parse error
  }
  return "";
};

const ChatPage = () => {
  const navigate = useNavigate();
  const currentUserId = getStoredUserId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isE2EEActive, setIsE2EEActive] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const sessionKeyRef = useRef<CryptoKey | null>(null);

  const connected = true;
  const loading = false;

  // Mark unread messages as read
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.senderId !== currentUserId && !msg.isRead) {
        socket.emit("message-read", {
          messageId: msg.id,
        });
      }
    });
  }, [messages, currentUserId]);

  useEffect(() => {
    const handleMessageRead = ({ messageId }: { messageId: string }) => {
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

  // Real-time session-ended listener
  useEffect(() => {
    const handleSessionEnded = ({ sessionId }: { sessionId: number }) => {
      if (selectedSession && Number(selectedSession.id) === Number(sessionId)) {
        setSelectedSession((prev) => (prev ? { ...prev, status: "completed" } : null));
      }
    };

    socket.on("session-ended", handleSessionEnded);
    return () => {
      socket.off("session-ended", handleSessionEnded);
    };
  }, [selectedSession]);

  // Real-time peer online status listener
  useEffect(() => {
    if (!selectedSession || !currentUserId) {
      setIsPeerOnline(false);
      return;
    }

    const peerId =
      Number(selectedSession.helper_id) === Number(currentUserId)
        ? Number(selectedSession.requester_id)
        : Number(selectedSession.helper_id);

    const checkPeerStatus = () => {
      socket.emit("check-user-status", { userId: peerId }, (res?: { userId: number; isOnline: boolean }) => {
        if (res && Number(res.userId) === peerId) {
          setIsPeerOnline(Boolean(res.isOnline));
        }
      });
    };

    checkPeerStatus();

    const handleUserStatusChanged = (data: { userId: number; isOnline: boolean }) => {
      if (Number(data.userId) === peerId) {
        setIsPeerOnline(Boolean(data.isOnline));
      }
    };

    socket.on("user-status-changed", handleUserStatusChanged);
    socket.on("connect", checkPeerStatus);

    return () => {
      socket.off("user-status-changed", handleUserStatusChanged);
      socket.off("connect", checkPeerStatus);
    };
  }, [selectedSession, currentUserId]);

  // Real-time message listener with client-side decryption
  useEffect(() => {
    const handleReceiveMessage = async (msg: any) => {
      let content = msg.content;

      // If session key is available, decrypt the payload
      if (sessionKeyRef.current && content) {
        content = await decryptChatMessage(content, sessionKeyRef.current);
      }

      const message: Message = {
        id: String(msg.id),
        sessionId: String(msg.session_id),
        senderId: String(msg.sender_id),
        content,

        messageType: msg.message_type || "text",

        mediaUrl: msg.media_url || undefined,
        mediaName: msg.media_name || undefined,
        mediaMimeType: msg.media_mime_type || undefined,
        mediaSize: msg.media_size ? Number(msg.media_size) : undefined,

        createdAt: msg.created_at,
        isDelivered: msg.is_delivered,
        isRead: msg.is_read,
      };

      setMessages((prev) => [...prev, message]);

      if (message.senderId !== currentUserId) {
        socket.emit("message-delivered", {
          messageId: message.id,
        });
      }
    };

    socket.on("receive-message", handleReceiveMessage);
    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [currentUserId]);

  // Session selection & E2EE key derivation & historical message loading
  useEffect(() => {
    let isCancelled = false;

    const setupSessionAndLoadMessages = async () => {
      if (!selectedSession) {
        sessionKeyRef.current = null;
        setIsE2EEActive(false);
        setMessages([]);
        return;
      }

      sessionKeyRef.current = null;
      setIsE2EEActive(false);

      const peerId =
        String(selectedSession.helper_id) === String(currentUserId)
          ? selectedSession.requester_id
          : selectedSession.helper_id;

      // 1. Fetch raw messages from backend
      let rawMessagesList: any[] = [];
      try {
        const msgRes = await axios.get(
          `${API}/api/sessions/${selectedSession.id}/messages`,
          {
            withCredentials: true,
          },
        );
        rawMessagesList = msgRes.data?.data || [];
      } catch (err) {
        console.error("Failed to fetch session messages:", err);
      }

      if (isCancelled) return;

      // 2. Derive E2EE Session Key
      let derivedKey: CryptoKey | null = null;
      try {
        let myPrivateKey = await getLocalPrivateKey(currentUserId);
        if (!myPrivateKey) {
          const initRes = await initializeUserCryptoKeys(currentUserId);
          myPrivateKey = initRes?.privateKey || null;
        }

        const peerPublicKeyJwk = await fetchUserPublicKey(peerId);

        if (myPrivateKey && peerPublicKeyJwk) {
          derivedKey = await deriveSessionKey(
            myPrivateKey,
            peerPublicKeyJwk,
            selectedSession.id
          );
        }
      } catch (keyErr) {
        console.warn("Could not derive E2EE session key:", keyErr);
      }

      if (isCancelled) return;

      if (derivedKey) {
        sessionKeyRef.current = derivedKey;
        setIsE2EEActive(true);
      } else {
        sessionKeyRef.current = null;
        setIsE2EEActive(false);
      }

      // 3. Decrypt historical messages
      const decryptedMessages: Message[] = await Promise.all(
        rawMessagesList.map(async (raw: any) => {
          let content = raw.content;
          if (derivedKey && content) {
            content = await decryptChatMessage(content, derivedKey);
          }
          return {
            id: String(raw.id),
            sessionId: String(raw.session_id),
            senderId: String(raw.sender_id),
            content,

            messageType: raw.message_type || "text",

            mediaUrl: raw.media_url || undefined,
            mediaName: raw.media_name || undefined,
            mediaMimeType: raw.media_mime_type || undefined,
            mediaSize: raw.media_size ? Number(raw.media_size) : undefined,

            createdAt: raw.created_at,
            isRead: raw.is_read,
            isDelivered: raw.is_delivered,
          };
        })
      );

      if (isCancelled) return;

      setMessages(decryptedMessages);
      socket.emit("join-session", selectedSession.id);

      try {
        const res = await getNextUserById(
          selectedSession.helper_id,
          selectedSession.requester_id,
        );
        if (!isCancelled) {
          setChatUser(res);
        }
      } catch (userErr) {
        console.error("Failed to load chat user profile:", userErr);
      }
    };

    setupSessionAndLoadMessages();

    return () => {
      isCancelled = true;
    };
  }, [selectedSession, currentUserId]);

  // Outgoing encrypted message sender
  const handleSendMessage = async (textToSend: string) => {
    if (!selectedSession) return;

    let payloadContent = textToSend;
    if (sessionKeyRef.current) {
      payloadContent = await encryptChatMessage(textToSend, sessionKeyRef.current);
    }

    socket.emit("send-message", {
      type: "session",
      sessionId: selectedSession.id,
      content: payloadContent,
    });
  };

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

      const media = response.data?.data;
      if (!media?.mediaUrl) {
        throw new Error("Media URL was not returned by the server");
      }

      let encryptedCaption = caption;
      if (caption && sessionKeyRef.current) {
        encryptedCaption = await encryptChatMessage(caption, sessionKeyRef.current);
      }

      socket.emit("send-message", {
        type: "session",
        sessionId: selectedSession.id,
        content: encryptedCaption,
        messageType: media.messageType,
        mediaUrl: media.mediaUrl,
        mediaName: media.mediaName,
        mediaMimeType: media.mediaMimeType,
        mediaSize: media.mediaSize,
      });
    } catch (error) {
      console.error("Failed to send media:", error);
    }
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;
    try {
      setIsEnding(true);
      await endSession(Number(selectedSession.id));
      setSelectedSession((prev) => (prev ? { ...prev, status: "completed" } : null));
      socket.emit("end-session", { sessionId: selectedSession.id });
      setEndDialogOpen(false);
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setIsEnding(false);
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
        <SessionSidebar
          onSelectSession={setSelectedSession}
          selectedSessionId={selectedSession?.id}
          activeSessionStatus={selectedSession?.status}
        />
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
                    connected: isPeerOnline,
                  }}
                  badge={
                    <Chip
                      icon={isE2EEActive ? <LockIcon sx={{ fontSize: "11px !important" }} /> : <LockOpenIcon sx={{ fontSize: "11px !important" }} />}
                      label={isE2EEActive ? "E2EE" : "Standard"}
                      size="small"
                      variant="outlined"
                      color={isE2EEActive ? "success" : "default"}
                      sx={{
                        height: 18,
                        fontSize: 10,
                        fontWeight: 600,
                        "& .MuiChip-label": { px: 0.75 },
                        "& .MuiChip-icon": { ml: 0.5, mr: -0.25 },
                      }}
                    />
                  }
                />
              </Box>

              <Tooltip title={selectedSession.status !== "active" ? "Session has ended" : "Start video call"}>
                <span>
                  <IconButton
                    color="primary"
                    disabled={selectedSession.status !== "active" || selectedSession.mode !== "call"}
                    onClick={() => navigate(`/meeting/${selectedSession.id}`)}
                    sx={{
                      ml: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "8px",
                      p: 0.8,
                      "&.Mui-disabled": { opacity: 0.4 },
                    }}
                  >
                    <VideoCallIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {selectedSession.status === "active" ? (
                <Tooltip title="End session">
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => setEndDialogOpen(true)}
                      sx={{
                        ml: 1,
                        border: "1px solid",
                        borderColor: "error.light",
                        borderRadius: "8px",
                        p: 0.8,
                        color: "error.main",
                        "&:hover": {
                          bgcolor: "rgba(211, 47, 47, 0.08)",
                        },
                      }}
                    >
                      <CancelOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Chip
                  label="Completed"
                  size="small"
                  variant="outlined"
                  sx={{
                    ml: 1,
                    height: 26,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                />
              )}
            </Box>

            <ChatWindow
              messages={messages}
              loading={loading}
              currentUserId={currentUserId}
            />

            {selectedSession.status === "active" ? (
              <MessageInput
                onSend={handleSendMessage}
                onSendMedia={handleSendMedia}
                disabled={!connected}
              />
            ) : (
              <Box
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: "action.hover",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  🔒 This session has ended. Messaging and video calls are closed.
                </Typography>
              </Box>
            )}
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

      <Dialog
        open={endDialogOpen}
        onClose={() => !isEnding && setEndDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>End this session?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Ending this session will permanently close messaging and video calls for both participants. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEndDialogOpen(false)} disabled={isEnding} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleEndSession} disabled={isEnding} variant="contained" color="error">
            {isEnding ? "Ending..." : "End Session"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;
