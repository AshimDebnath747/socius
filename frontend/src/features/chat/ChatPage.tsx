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
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import SessionSidebar from "./components/SessionSidebar";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "../../types/session";
import { getNextUserById } from "../../services/user.service";
import { endSession, getSessionById } from "../../services/session.service";
import { socket } from "../../socket";
import { type Message, type MessageType } from "./types";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
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
import {
  getCachedSessionPeer,
  getCachedSessions,
  getCachedUserProfile,
  setCachedSessionPeer,
  setCachedUserProfile,
} from "../../lib/userCache";

const API = import.meta.env.VITE_BACKEND_URL;

const getStoredUserId = (): string => {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return String(parsed.id || parsed.userId || "");
    }
  } catch {
    // ignore parse error
  }
  return "";
};

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");
  const [currentUserId, setCurrentUserId] = useState<string>(() => getStoredUserId());

  useEffect(() => {
    const syncUserId = () => {
      const stored = getStoredUserId();
      if (stored && stored !== currentUserId) {
        setCurrentUserId(stored);
      }
    };
    syncUserId();
    window.addEventListener("storage", syncUserId);
    return () => window.removeEventListener("storage", syncUserId);
  }, [currentUserId]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isE2EEActive, setIsE2EEActive] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursorRef = useRef<number | string | null>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [callMenuAnchor, setCallMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSelectSession = useCallback((session: Session) => {
    // Clear stale state immediately so the UI reflects the new session right away
    setMessages([]);
    setChatUser(null);
    setSelectedSession(session);
    setSearchParams({ sessionId: String(session.id) }, { replace: true });
    const myId = String(currentUserId || getStoredUserId());
    const isRequester = String(session.requester_id) === myId;
    const peerId = isRequester ? session.helper_id : session.requester_id;
    // Optimistically populate the header from cache while the full profile loads
    const cached = getCachedSessionPeer(session.id) || getCachedUserProfile(peerId);
    if (cached) {
      setChatUser({
        id: String(cached.id),
        name: cached.name,
        avatar: cached.avatar || cached.avatarUrl,
        avatarUrl: cached.avatarUrl || cached.avatar,
        role: cached.role || (isRequester ? "helper" : "requester"),
      });
    } else if (session.peer_name) {
      setChatUser({
        id: String(peerId),
        name: session.peer_name,
        avatar: session.peer_avatar,
        avatarUrl: session.peer_avatar,
        role: isRequester ? "helper" : "requester",
      });
    }
  }, [currentUserId, setSearchParams]);

  // Auto-restore session from URL on initial page load (e.g. returning from a call).
  // This effect intentionally only depends on `urlSessionId` so it does NOT
  // re-run every time the user clicks a different chat in the sidebar — that
  // was causing the URL update from `setSearchParams` to race against
  // `setSelectedSession` and re-trigger session loading with stale data.
  const hasRestoredFromUrl = useRef(false);
  useEffect(() => {
    // Only restore once on mount, or if no session is currently selected
    if (hasRestoredFromUrl.current) return;
    if (!urlSessionId) return;
    const targetId = Number(urlSessionId);
    if (!targetId) return;

    hasRestoredFromUrl.current = true;

    const cachedSessions = getCachedSessions();
    const foundSession = cachedSessions?.find((s) => Number(s.id) === targetId);

    if (foundSession) {
      handleSelectSession(foundSession);
    } else {
      getSessionById(targetId)
        .then((session) => {
          if (session) {
            handleSelectSession(session);
          }
        })
        .catch((err) => {
          console.warn("Could not load session from URL:", err);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSessionId]);

  const handleStartCall = (mode: "voice" | "video") => {
    setCallMenuAnchor(null);
    if (selectedSession) {
      const peerName = chatUser?.name || "";
      const peerAvatar = chatUser?.avatar || "";
      const query = new URLSearchParams({
        mode,
        ...(peerName ? { peerName } : {}),
        ...(peerAvatar ? { peerAvatar } : {}),
      }).toString();
      navigate(`/meeting/${selectedSession.id}?${query}`, {
        state: { peerName, peerAvatar, callMode: mode },
      });
    }
  };

  const sessionKeyRef = useRef<CryptoKey | null>(null);

  const connected = true;
  const loading = false;

  // Mark unread messages as read
  useEffect(() => {
    const myId = String(currentUserId || getStoredUserId());
    messages.forEach((msg) => {
      if (myId && msg.senderId !== myId && !msg.isRead) {
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
    const myId = String(currentUserId || getStoredUserId());
    if (!selectedSession || !myId) {
      setIsPeerOnline(false);
      return;
    }

    const isRequester = String(selectedSession.requester_id) === myId;
    const peerId = Number(isRequester ? selectedSession.helper_id : selectedSession.requester_id);

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
      if (sessionKeyRef.current && content && msg.message_type !== "call") {
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
        isPending: false,
      };

      const myId = String(currentUserId || getStoredUserId());
      setMessages((prev) => {
        // If this echo is our own message, replace the oldest pending bubble
        // (FIFO — socket echoes always arrive in send order, so the first
        // pending entry from us is always the right one to swap out).
        if (myId && message.senderId === myId) {
          const pendingIdx = prev.findIndex(
            (m) => m.isPending && m.senderId === myId
          );
          if (pendingIdx !== -1) {
            const next = [...prev];
            next[pendingIdx] = message;
            return next;
          }
        }
        // Incoming message from the other side — just append
        return [...prev, message];
      });

      if (myId && message.senderId !== myId) {
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

      const myId = String(currentUserId || getStoredUserId());
      if (!myId) return;

      const isRequester = String(selectedSession.requester_id) === myId;
      const isHelper = String(selectedSession.helper_id) === myId;
      if (!isRequester && !isHelper) {
        console.warn("User is not a participant of session:", selectedSession.id);
        return;
      }

      const peerId = isRequester ? selectedSession.helper_id : selectedSession.requester_id;

      // 1. Check localStorage first for instant 0ms user profile rendering
      const cached = getCachedSessionPeer(selectedSession.id) || getCachedUserProfile(peerId);
      if (cached) {
        setChatUser({
          id: String(cached.id),
          name: cached.name,
          avatar: cached.avatar || cached.avatarUrl,
          avatarUrl: cached.avatarUrl || cached.avatar,
          role: cached.role || (isRequester ? "helper" : "requester"),
        });
      } else if (selectedSession.peer_name) {
        setChatUser({
          id: String(peerId),
          name: selectedSession.peer_name,
          avatar: selectedSession.peer_avatar,
          avatarUrl: selectedSession.peer_avatar,
          role: isRequester ? "helper" : "requester",
        });
      }

      // 2. Fetch initial page of messages from backend (limit: 30)
      let rawMessagesList: any[] = [];
      try {
        const msgRes = await axios.get(
          `${API}/api/sessions/${selectedSession.id}/messages`,
          {
            params: { limit: 30 },
            withCredentials: true,
          },
        );
        const resData = msgRes.data?.data;
        if (resData && Array.isArray(resData.messages)) {
          rawMessagesList = resData.messages;
          setHasMoreMessages(Boolean(resData.hasMore));
          nextCursorRef.current = resData.nextCursor || null;
        } else if (Array.isArray(resData)) {
          rawMessagesList = resData;
          setHasMoreMessages(false);
          nextCursorRef.current = null;
        }
      } catch (err) {
        console.error("Failed to fetch session messages:", err);
      }

      if (isCancelled) return;

      // 2. Derive E2EE Session Key
      let derivedKey: CryptoKey | null = null;
      try {
        const initRes = await initializeUserCryptoKeys(myId);
        const myPrivateKey = initRes?.privateKey || (await getLocalPrivateKey(myId));

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
          if (derivedKey && content && raw.message_type !== "call") {
            content = await decryptChatMessage(content, derivedKey);
          } else if (!derivedKey && content && raw.message_type !== "call") {
            const trimmed = typeof content === "string" ? content.trim() : "";
            if (trimmed.startsWith("{") && trimmed.includes('"ct"') && trimmed.includes('"iv"')) {
              content = "🔒 [Encrypted message - waiting for keys]";
            }
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
        if (!isCancelled && res) {
          const profile = {
            id: String(res.id),
            name: res.name,
            avatar: res.avatar,
            avatarUrl: res.avatar,
            role: res.role,
          };
          setChatUser(profile);
          setCachedSessionPeer(selectedSession.id, profile);
          setCachedUserProfile(profile);
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

  const handleLoadMoreMessages = useCallback(async () => {
    if (!selectedSession || !hasMoreMessages || isLoadingMore || !nextCursorRef.current) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const cursor = nextCursorRef.current;
      const msgRes = await axios.get(
        `${API}/api/sessions/${selectedSession.id}/messages`,
        {
          params: { cursor, limit: 30 },
          withCredentials: true,
        },
      );
      const resData = msgRes.data?.data;
      let olderRawList: any[] = [];
      if (resData && Array.isArray(resData.messages)) {
        olderRawList = resData.messages;
        setHasMoreMessages(Boolean(resData.hasMore));
        nextCursorRef.current = resData.nextCursor || null;
      }

      if (olderRawList.length > 0) {
        const derivedKey = sessionKeyRef.current;
        const olderDecrypted: Message[] = await Promise.all(
          olderRawList.map(async (raw: any) => {
            let content = raw.content;
            if (derivedKey && content && raw.message_type !== "call") {
              content = await decryptChatMessage(content, derivedKey);
            }
            return {
              id: String(raw.id),
              sessionId: String(raw.session_id),
              senderId: String(raw.sender_id),
              content,
              messageType: (raw.message_type as MessageType) || "text",
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

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = olderDecrypted.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedSession, hasMoreMessages, isLoadingMore]);

  // Outgoing encrypted message sender
  const handleSendMessage = async (textToSend: string) => {
    if (!selectedSession) return;

    const myId = String(currentUserId || getStoredUserId());

    // 1. Push an optimistic message immediately so the UI feels instant
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      sessionId: String(selectedSession.id),
      senderId: myId,
      content: textToSend,
      messageType: "text",
      createdAt: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
      isPending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. Encrypt and emit to server
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

    const myId = String(currentUserId || getStoredUserId());

    // Show an optimistic bubble while the upload is in-flight
    const optimisticId = `pending-${Date.now()}`;
    const localPreviewUrl = URL.createObjectURL(file);
    const optimisticMsg: Message = {
      id: optimisticId,
      sessionId: String(selectedSession.id),
      senderId: myId,
      content: caption,
      messageType: file.type.startsWith("video/") ? "video" : "image",
      mediaUrl: localPreviewUrl,
      mediaName: file.name,
      mediaMimeType: file.type,
      mediaSize: file.size,
      createdAt: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
      isPending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

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
      // Remove the failed optimistic bubble
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
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
      <Box sx={{ display: { xs: selectedSession ? "none" : "flex", md: "flex" }, width: { xs: "100%", md: 330 }, flexShrink: 0 }}>
        <SessionSidebar
          onSelectSession={handleSelectSession}
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
              <IconButton
                onClick={() => {
                  setSelectedSession(null);
                  setSearchParams({}, { replace: true });
                }}
                aria-label="Back to conversations"
                sx={{ display: { xs: "inline-flex", md: "none" }, ml: 0.5 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ChatHeader
                  otherUser={{
                    name: chatUser?.name || selectedSession.peer_name || "Help Partner",
                    role: chatUser?.role || (String(currentUserId) === String(selectedSession.requester_id) ? "helper" : "requester"),
                    avatarUrl: chatUser?.avatar || chatUser?.avatarUrl || selectedSession.peer_avatar,
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

              <Tooltip title={selectedSession.status !== "active" ? "Session has ended" : "Start call"}>
                <span>
                  <IconButton
                    color="primary"
                    disabled={selectedSession.status !== "active" || selectedSession.mode !== "call"}
                    onClick={(e) => setCallMenuAnchor(e.currentTarget)}
                    aria-label="Start call"
                    sx={{
                      ml: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "8px",
                      p: 0.8,
                      "&.Mui-disabled": { opacity: 0.4 },
                    }}
                  >
                    <CallIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Menu
                anchorEl={callMenuAnchor}
                open={Boolean(callMenuAnchor)}
                onClose={() => setCallMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      minWidth: 175,
                      mt: 0.5,
                    },
                  },
                }}
              >
                <MenuItem onClick={() => handleStartCall("voice")} sx={{ py: 1, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                    <CallIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Voice Call" secondary="Audio only" primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }} secondaryTypographyProps={{ fontSize: 11 }} />
                </MenuItem>
                <MenuItem onClick={() => handleStartCall("video")} sx={{ py: 1, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                    <VideocamIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Video Call" secondary="Camera & mic" primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }} secondaryTypographyProps={{ fontSize: 11 }} />
                </MenuItem>
              </Menu>

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
              onStartCall={handleStartCall}
              onLoadMore={handleLoadMoreMessages}
              hasMore={hasMoreMessages}
              loadingMore={isLoadingMore}
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
