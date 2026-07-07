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
import type { Community } from "../../types/community";
import type { Message } from "../chat/types";
import axios from 'axios';
import ChatWindow from "../chat/components/ChatWindow";
import MessageInput from "../chat/components/MessageInput";
import ChatHeader from "../chat/components/ChatHeader";
const API = import.meta.env.VITE_BACKEND_URL;
const socket = io(API, {
  withCredentials: true,
});
const user: string | null = localStorage.getItem("user")
let CURRENT_USER_ID: string = ""
if (user) CURRENT_USER_ID = String(JSON.parse(user).id);
const CommunityPage = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedCommunity, setSelectedCommunity] =
    useState<Community | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchCommunities = async () => {
    try {
      const data = await getAllCommunities();

      setCommunities(data);

      // Select first community if none selected
      if (data.length > 0 && !selectedCommunity) {
        setSelectedCommunity(data[0]);
      }

      // If selected community no longer exists,
      // select the first available community.
      if (
        selectedCommunity &&
        !data.find((c: { id: number; }) => c.id === selectedCommunity.id)
      ) {
        setSelectedCommunity(data[0] ?? null);
      }
      setLoading(false)
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {

    const handleReceiveMessage = (msg: any) => {
      //console.log(msg)
      const message: Message = {
        id: String(msg.id),
        sessionId: String(msg.session_id),
        senderId: String(msg.sender_id),
        content: msg.content,
        createdAt: msg.created_at,
      };

      setMessages((prev) => [...prev, message]);
    };
    socket.on("receive-message", handleReceiveMessage);
    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!selectedCommunity) return;
        console.log("selected session:", selectedCommunity.id)

        const msg = await axios.get(`${API}/api/communities/${selectedCommunity.id}/messages`, {
          withCredentials: true
        });

        console.log(msg.data)
        const messages: Message[] = msg.data?.data?.map((msg: any) => ({
          id: String(msg.id),
          sessionId: String(msg.session_id),
          senderId: String(msg.sender_id),
          content: msg.content,
          createdAt: msg.created_at,
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
              }}
            />

            <ChatWindow
              messages={messages}
              loading={loading}
              currentUserId={CURRENT_USER_ID}
            />

            <MessageInput
              onSend={(content) => {
                if (!selectedCommunity) return;

                socket.emit("send-message", {
                  type: "community",
                  sessionId: selectedCommunity.id,
                  content,
                });
              }}
              disabled={false}
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
            <Typography variant="h5">Select a conversation</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CommunityPage;