
import {
  Alert,
  Box,
  Snackbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import CommunitySidebar from "../communities/components/communitiesSidebar";
import CreateCommunityPage from "../communities/components/CreateCommunityPage";
import { io } from "socket.io-client";
import { getAllCommunities } from "../../services/community.service";
import type { Community, CommunityMessage } from "../../types/community";
import axios from 'axios';
import CommunityChatWindow from "./components/CommunityChatWindow";
import MessageInput from "../chat/components/MessageInput";
import ChatHeader from "../chat/components/ChatHeader";
import CommunityDashboard from "./components/communityDashboard";
const API = import.meta.env.VITE_BACKEND_URL;
const socket = io(API, {
  withCredentials: true,
});
const user: string | null = localStorage.getItem("user")
let CURRENT_USER_ID: string = ""
if (user) CURRENT_USER_ID = String(JSON.parse(user).id);
const CommunityPage = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedCommunity, setSelectedCommunity] =
    useState<Community | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchCommunities = async () => {
    try {
      setLoading(true);

      const data = await getAllCommunities();

      setCommunities(data);

      setSelectedCommunity((prev) => {
        if (data.length === 0) return null;

        if (!prev) return data[0];

        const exists = data.some((c: { id: number; }) => c.id === prev.id);

        return exists ? prev : data[0];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    messages.forEach((msg) => {
      if (
        msg.senderId !== CURRENT_USER_ID &&
        !msg.isRead
      ) {
        socket.emit("message-read", {
          messageId: msg.id,
        });
      }
    });
  }, [messages]);

  useEffect(() => {

    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      console.log("message read event hit on message id", messageId)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === String(messageId)
            ? {
              ...msg,
              isRead: true,
            }
            : msg
        )
      );
    };

    socket.on("message-read", handleMessageRead);

    return () => {
      socket.off("message-read", handleMessageRead);
    }

  }, []);
  useEffect(() => {

    const handleDelivered = ({
      messageId,
    }: {
      messageId: number;
    }) => {

      setMessages(prev =>
        prev.map(msg =>
          String(msg.id) === String(messageId)
            ? {
              ...msg,
              isDelivered: true,
            }
            : msg
        )
      );

    };

    socket.on(
      "message-delivered",
      handleDelivered
    );

    return () => {
      socket.off(
        "message-delivered",
        handleDelivered
      );
    };

  }, []);
  // receive messages ->
  useEffect(() => {
    const handleReceiveMessage = (msg: any) => {
      console.log("received msg :", msg)
      // if (String(msg.community_id) !== String(selectedCommunity?.id)) {
      //   return;
      // }
      const message: CommunityMessage = {
        id: String(msg.id),
        sessionId: msg.session_id ? String(msg.session_id) : null,
        communityId: msg.community_id ? String(msg.community_id) : null,
        senderId: String(msg.sender_id),
        content: msg.content,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        name: msg.name,
        avatar: msg.avatar,
        email: msg.email,

        isDelivered: msg.is_delivered,
        isRead: msg.is_read
      };

      socket.emit("message-delivered", {
        messageId: msg.id,
      });
      setMessages((prev) => [...prev, message]);
    };
    socket.on("receive-message", handleReceiveMessage);
    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);
  //get community messagges!
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!selectedCommunity) return;
        console.log("selected community:", selectedCommunity.id)

        const msg = await axios.get(`${API}/api/communities/${selectedCommunity.id}/messages`, {
          withCredentials: true
        });

        console.log(msg.data)
        const messages: CommunityMessage[] = msg.data?.data?.map((msg: any) => ({
          id: String(msg.id),
          sessionId: msg.session_id ? String(msg.session_id) : null,
          communityId: msg.community_id ? String(msg.community_id) : null,
          senderId: String(msg.sender_id),
          content: msg.content,
          createdAt: msg.created_at,
          updatedAt: msg.updated_at,
          name: msg.name,
          avatar: msg.avatar,
          email: msg.email,

          isDelivered: msg.is_delivered,
          isRead: msg.is_read
        }));
        setMessages(messages);
        socket.emit("join-community", selectedCommunity.id);

      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [selectedCommunity]);
  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCommunityCreated = async () => {
    await fetchCommunities();
    setShowCreate(false);
    setSnackbarOpen(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <CommunitySidebar
        communities={communities}
        loading={loading}
        showCreate={showCreate}
        onSelectCommunity={setSelectedCommunity}
        onToggleCreateCommunity={() =>
          setShowCreate((prev) => !prev)
        }
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
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
          <CreateCommunityPage onSuccess={handleCommunityCreated} />
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
            <ChatHeader
              otherUser={{
                name: selectedCommunity.name || "Loading...",
                role: "click for more info",
                avatarUrl: selectedCommunity.avatar
              }}
              onClick={() => setShowDashboard(true)}
            />
            {showDashboard ? (
              <CommunityDashboard community={selectedCommunity} onBack={() => setShowDashboard(false)} />
            ) : (
              <CommunityChatWindow
                messages={messages}
                loading={loading}
                currentUserId={CURRENT_USER_ID}
              />
            )}


            {!showDashboard && <MessageInput
              onSend={(content) => {
                if (!selectedCommunity) return;

                socket.emit("send-message", {
                  type: "community",
                  sessionId: selectedCommunity.id,
                  content,
                });
              }}
              disabled={false}
            />}
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
            <Typography variant="h5">Select a conversation</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CommunityPage;