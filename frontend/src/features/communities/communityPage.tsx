import { Alert, Box, IconButton, Snackbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CommunitySidebar from "../communities/components/communitiesSidebar";
import CreateCommunityPage from "../communities/components/CreateCommunityPage";
import { socket } from "../../socket";
import { getAllCommunities } from "../../services/community.service";
import type { Community, CommunityMessage } from "../../types/community";
import axios from "axios";
import CommunityChatWindow from "./components/CommunityChatWindow";
import MessageInput from "../chat/components/MessageInput";
import TypingIndicator from "../chat/components/TypingIndicator";
import ChatHeader from "../chat/components/ChatHeader";
import CommunityDashboard from "./components/communityDashboard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const API = import.meta.env.VITE_BACKEND_URL;

const getStoredUserId = (): string => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.id != null ? String(parsed.id) : "";
  } catch {
    return "";
  }
};

const getStoredUserName = (): string => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.name || parsed.username || "";
  } catch {
    return "";
  }
};

const CommunityPage = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCommunityId = searchParams.get("communityId");

  const [currentUserId, setCurrentUserId] = useState<string>(() => getStoredUserId());
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const nextCursorRef = useRef<string | null>(null);

  // Typing indicators state for community members
  const [typingUsers, setTypingUsers] = useState<Record<string, { userName: string; timeoutId: ReturnType<typeof setTimeout> }>>({});

  const getTypingText = (users: Record<string, { userName: string }>): string => {
    const names = Object.values(users)
      .map((u) => u.userName)
      .filter(Boolean);
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]} and ${names.length - 1} others are typing...`;
  };

  // Keep a ref to the selected community so socket handlers always see the latest active community
  const selectedCommunityRef = useRef<Community | null>(null);
  useEffect(() => {
    selectedCommunityRef.current = selectedCommunity;
  }, [selectedCommunity]);

  // Keep currentUserId in sync
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

  const handleSelectCommunity = useCallback(
    (community: Community | null) => {
      setSelectedCommunity(community);
      setShowDashboard(false);
      if (community) {
        setSearchParams({ communityId: String(community.id) }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams]
  );

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCommunities();
      setCommunities(data);

      setSelectedCommunity((prev) => {
        if (data.length === 0) return null;

        if (urlCommunityId) {
          const matching = data.find((c: { id: number }) => String(c.id) === String(urlCommunityId));
          if (matching) return matching;
        }

        if (!prev) return isDesktop ? data[0] : null;

        const exists = data.some((c: { id: number }) => c.id === prev.id);
        return exists ? prev : data[0];
      });
    } catch (err) {
      console.error("Failed to fetch communities:", err);
    } finally {
      setLoading(false);
    }
  }, [isDesktop, urlCommunityId]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Read receipts: emit message-read for unread incoming messages
  useEffect(() => {
    const myId = String(currentUserId || getStoredUserId());
    messages.forEach((msg) => {
      if (!msg.isPending && String(msg.senderId) !== myId && !msg.isRead) {
        socket.emit("message-read", {
          messageId: msg.id,
        });
      }
    });
  }, [messages, currentUserId]);

  // Handle incoming message-read event
  useEffect(() => {
    const handleMessageRead = ({ messageId }: { messageId: string | number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId)
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

  // Handle incoming message-delivered event
  useEffect(() => {
    const handleDelivered = ({ messageId }: { messageId: string | number }) => {
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

  // Handle receiving messages via socket
  useEffect(() => {
    const handleReceiveMessage = (msg: any) => {
      const activeCommunity = selectedCommunityRef.current;
      if (
        activeCommunity &&
        msg.community_id &&
        String(msg.community_id) !== String(activeCommunity.id)
      ) {
        return;
      }

      const message: CommunityMessage = {
        id: String(msg.id),
        sessionId: msg.session_id ? String(msg.session_id) : null,
        communityId: msg.community_id ? String(msg.community_id) : null,
        senderId: String(msg.sender_id),
        content: msg.content || "",
        messageType: msg.message_type || "text",
        mediaUrl: msg.media_url || null,
        mediaName: msg.media_name || null,
        mediaMimeType: msg.media_mime_type || undefined,
        mediaSize: msg.media_size ? Number(msg.media_size) : undefined,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        name: msg.name,
        avatar: msg.avatar,
        email: msg.email,
        isDelivered: Boolean(msg.is_delivered),
        isRead: Boolean(msg.is_read),
        isPending: false,
      };

      const myId = String(currentUserId || getStoredUserId());
      setMessages((prev) => {
        // If this echo is our own message, replace the oldest pending bubble (FIFO)
        if (myId && String(message.senderId) === myId) {
          const pendingIdx = prev.findIndex(
            (m) => m.isPending && String(m.senderId) === myId,
          );
          if (pendingIdx !== -1) {
            const next = [...prev];
            next[pendingIdx] = message;
            return next;
          }
        }
        // Deduplicate
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Emit delivered receipt only for foreign messages
      if (myId && String(message.senderId) !== myId) {
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

  // Real-time typing indicators listener for community members
  useEffect(() => {
    const handleUserTyping = (data: { type: string; targetId: string; userId: string; userName: string }) => {
      const activeCommunity = selectedCommunityRef.current;
      const myId = String(currentUserId || getStoredUserId());

      if (
        data.type === "community" &&
        activeCommunity &&
        String(data.targetId) === String(activeCommunity.id) &&
        String(data.userId) !== myId
      ) {
        setTypingUsers((prev) => {
          if (prev[data.userId]?.timeoutId) {
            clearTimeout(prev[data.userId].timeoutId);
          }

          const timeoutId = setTimeout(() => {
            setTypingUsers((current) => {
              const updated = { ...current };
              delete updated[data.userId];
              return updated;
            });
          }, 4000);

          return {
            ...prev,
            [data.userId]: {
              userName: data.userName,
              timeoutId,
            },
          };
        });
      }
    };

    const handleUserStopTyping = (data: { type: string; targetId: string; userId: string }) => {
      const activeCommunity = selectedCommunityRef.current;
      if (
        data.type === "community" &&
        activeCommunity &&
        String(data.targetId) === String(activeCommunity.id)
      ) {
        setTypingUsers((prev) => {
          if (!prev[data.userId]) return prev;
          if (prev[data.userId].timeoutId) {
            clearTimeout(prev[data.userId].timeoutId);
          }
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
      }
    };

    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
    };
  }, [currentUserId]);

  // Clear typing users when community selection changes
  useEffect(() => {
    setTypingUsers((prev) => {
      Object.values(prev).forEach((u) => {
        if (u.timeoutId) clearTimeout(u.timeoutId);
      });
      return {};
    });
  }, [selectedCommunity?.id]);

  // Cleanup all typing timers on unmount
  useEffect(() => {
    return () => {
      setTypingUsers((prev) => {
        Object.values(prev).forEach((u) => {
          if (u.timeoutId) clearTimeout(u.timeoutId);
        });
        return {};
      });
    };
  }, []);

  // Fetch initial messages when selected community changes
  useEffect(() => {
    let isCancelled = false;

    const fetchMessages = async () => {
      if (!selectedCommunity) {
        setMessages([]);
        setHasMoreMessages(false);
        nextCursorRef.current = null;
        return;
      }

      setMessagesLoading(true);
      try {
        socket.emit("join-community", selectedCommunity.id);

        const msgRes = await axios.get(
          `${API}/api/communities/${selectedCommunity.id}/messages`,
          {
            params: { limit: 30 },
            withCredentials: true,
          },
        );

        if (isCancelled) return;

        const resData = msgRes.data?.data;
        let rawList: any[] = [];
        if (resData && Array.isArray(resData.messages)) {
          rawList = resData.messages;
          setHasMoreMessages(Boolean(resData.hasMore));
          nextCursorRef.current = resData.nextCursor ? String(resData.nextCursor) : null;
        } else if (Array.isArray(resData)) {
          rawList = resData;
          setHasMoreMessages(false);
          nextCursorRef.current = null;
        }

        const parsedMessages: CommunityMessage[] = rawList.map((m: any) => ({
          id: String(m.id),
          sessionId: m.session_id ? String(m.session_id) : null,
          communityId: m.community_id ? String(m.community_id) : null,
          senderId: String(m.sender_id),
          content: m.content || "",
          messageType: m.message_type || "text",
          mediaUrl: m.media_url || null,
          mediaName: m.media_name || null,
          mediaMimeType: m.media_mime_type || undefined,
          mediaSize: m.media_size ? Number(m.media_size) : undefined,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          name: m.name,
          avatar: m.avatar,
          email: m.email,
          isDelivered: Boolean(m.is_delivered),
          isRead: Boolean(m.is_read),
          isPending: false,
        }));

        setMessages(parsedMessages);
      } catch (err) {
        console.error("Failed to fetch community messages:", err);
      } finally {
        if (!isCancelled) {
          setMessagesLoading(false);
        }
      }
    };

    fetchMessages();

    return () => {
      isCancelled = true;
    };
  }, [selectedCommunity]);

  // Load more (older) messages on scroll-to-top
  const handleLoadMoreMessages = useCallback(async () => {
    if (!selectedCommunity || !hasMoreMessages || isLoadingMore || !nextCursorRef.current) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const cursor = nextCursorRef.current;
      const msgRes = await axios.get(
        `${API}/api/communities/${selectedCommunity.id}/messages`,
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
        nextCursorRef.current = resData.nextCursor ? String(resData.nextCursor) : null;
      }

      if (olderRawList.length > 0) {
        const olderParsed: CommunityMessage[] = olderRawList.map((raw: any) => ({
          id: String(raw.id),
          sessionId: raw.session_id ? String(raw.session_id) : null,
          communityId: raw.community_id ? String(raw.community_id) : null,
          senderId: String(raw.sender_id),
          content: raw.content || "",
          messageType: raw.message_type || "text",
          mediaUrl: raw.media_url || null,
          mediaName: raw.media_name || null,
          mediaMimeType: raw.media_mime_type || undefined,
          mediaSize: raw.media_size ? Number(raw.media_size) : undefined,
          createdAt: raw.created_at,
          updatedAt: raw.updated_at,
          name: raw.name,
          avatar: raw.avatar,
          email: raw.email,
          isDelivered: Boolean(raw.is_delivered),
          isRead: Boolean(raw.is_read),
          isPending: false,
        }));

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = olderParsed.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
      }
    } catch (err) {
      console.error("Failed to load more community messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedCommunity, hasMoreMessages, isLoadingMore]);

  const handleCommunityCreated = async () => {
    await fetchCommunities();
    setShowCreate(false);
    setSnackbarOpen(true);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedCommunity || !content.trim()) return;

    const myId = String(currentUserId || getStoredUserId());
    let parsedUser: any = null;
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) parsedUser = JSON.parse(rawUser);
    } catch {}

    const optimisticMsg: CommunityMessage = {
      id: `pending-${Date.now()}-${Math.random()}`,
      sessionId: null,
      communityId: String(selectedCommunity.id),
      senderId: myId,
      content: content.trim(),
      messageType: "text",
      mediaUrl: null,
      mediaName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: parsedUser?.name || "You",
      email: parsedUser?.email || "",
      avatar: parsedUser?.avatar || null,
      isDelivered: false,
      isRead: false,
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    socket.emit("send-message", {
      type: "community",
      sessionId: selectedCommunity.id,
      content: content.trim(),
    });
  };

  const handleSendMedia = async (file: File, caption: string) => {
    if (!selectedCommunity) return;

    const myId = String(currentUserId || getStoredUserId());
    let parsedUser: any = null;
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) parsedUser = JSON.parse(rawUser);
    } catch {}

    const blobUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");

    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const optimisticMsg: CommunityMessage = {
      id: tempId,
      sessionId: null,
      communityId: String(selectedCommunity.id),
      senderId: myId,
      content: caption,
      messageType: isVideo ? "video" : isImage ? "image" : "file",
      mediaUrl: blobUrl,
      mediaName: file.name,
      mediaMimeType: file.type,
      mediaSize: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: parsedUser?.name || "You",
      email: parsedUser?.email || "",
      avatar: parsedUser?.avatar || null,
      isDelivered: false,
      isRead: false,
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await axios.post(
        `${API}/api/communities/${selectedCommunity.id}/media`,
        formData,
        {
          withCredentials: true,
        },
      );

      const media = response.data.data;

      socket.emit("send-message", {
        type: "community",
        sessionId: selectedCommunity.id,
        content: caption,
        messageType: media.messageType,
        mediaUrl: media.mediaUrl,
        mediaName: media.mediaName,
        mediaMimeType: media.mediaMimeType,
        mediaSize: media.mediaSize,
      });
    } catch (err) {
      console.error("Failed to upload community media:", err);
      URL.revokeObjectURL(blobUrl);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: { xs: "calc(100dvh - 124px - env(safe-area-inset-bottom))", md: "calc(100vh - 68px)" },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {!showCreate && (
        <Box sx={{ display: { xs: selectedCommunity ? "none" : "flex", md: "flex" }, width: { xs: "100%", md: 330 }, flexShrink: 0 }}>
          <CommunitySidebar
            communities={communities}
            loading={loading}
            showCreate={showCreate}
            selectedCommunityId={selectedCommunity?.id}
            onSelectCommunity={handleSelectCommunity}
            onToggleCreateCommunity={() => setShowCreate((prev) => !prev)}
          />
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          ...(showCreate || selectedCommunity ? {} : { display: { xs: "none", md: "flex" } }),
        }}
      >
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Community created successfully.
          </Alert>
        </Snackbar>

        {showCreate ? (
          <CreateCommunityPage onSuccess={handleCommunityCreated} onCancel={() => setShowCreate(false)} />
        ) : selectedCommunity ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              width: "100%",
            }}
          >
            {!showDashboard && (
              <Box sx={{ display: "flex", alignItems: "center", bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                <IconButton onClick={() => handleSelectCommunity(null)} aria-label="Back to communities" sx={{ display: { xs: "inline-flex", md: "none" }, ml: 0.5 }}>
                  <ArrowBackIcon />
                </IconButton>
                <ChatHeader
                  otherUser={{
                    name: selectedCommunity.name || "Loading...",
                    role: selectedCommunity.isPrivate ? "Private Community" : "Public Community",
                    avatarUrl: selectedCommunity.avatar,
                  }}
                  isTyping={Object.keys(typingUsers).length > 0}
                  subtitle={getTypingText(typingUsers)}
                  onClick={() => setShowDashboard(true)}
                />
              </Box>
            )}
            {showDashboard ? (
              <CommunityDashboard
                community={selectedCommunity}
                onBack={() => setShowDashboard(false)}
              />
            ) : (
              <>
                <CommunityChatWindow
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={currentUserId}
                  onLoadMore={handleLoadMoreMessages}
                  hasMore={hasMoreMessages}
                  loadingMore={isLoadingMore}
                />
                <TypingIndicator text={getTypingText(typingUsers)} />
                <MessageInput
                  onSend={handleSendMessage}
                  onSendMedia={handleSendMedia}
                  onTyping={() => {
                    if (selectedCommunity) {
                      socket.emit("typing", {
                        type: "community",
                        targetId: selectedCommunity.id,
                        userName: getStoredUserName(),
                      });
                    }
                  }}
                  onStopTyping={() => {
                    if (selectedCommunity) {
                      socket.emit("stop-typing", {
                        type: "community",
                        targetId: selectedCommunity.id,
                      });
                    }
                  }}
                  disabled={false}
                />
              </>
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
            <Typography variant="h6" color="text.secondary">
              Choose a community to join the conversation
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CommunityPage;
