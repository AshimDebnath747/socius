import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { Snackbar, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { io } from 'socket.io-client';
import Navbar from "../components/layout/Navbar";
import WelcomePage from "../features/home/WelcomePage";
import FeedPage from "../features/posts/pages/FeedPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ChatPage from "../features/chat/ChatPage";
import HelpRequestForm from "../features/helpRequest/HelpRequestForm";
import PostPage from "../features/posts/pages/HelpRequestPage";
import CommunityPage from "../features/communities/communityPage";
import ExploreCommunities from "../features/communities/pages/explorecommunites";
import axios from 'axios';
import Loader from "../components/loader";
import CommunityInfo from "../features/communities/pages/communityInfo";
import UserProfile from "../features/profile/UserProfile";
const API = import.meta.env.VITE_BACKEND_URL;
const socket = io(API, {
  withCredentials: true
});
const App = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const [notification, setNotification] = useState<{
    open: boolean;
    type: "session" | "community" | null;
    sessionId: number | null;
    communityId: number | null;
    message: string;
  }>({
    open: false,
    type: null,
    sessionId: null,
    communityId: null,
    message: "",
  });

  useEffect(() => {
    const handleSessionNotification = (data: {
      messageId: number;
      sessionId: number;
      senderName: string;
      preview: string;
    }) => {
      console.log("notification received!")
      setNotification({
        open: true,
        type: "session",
        sessionId: data.sessionId,
        communityId: null,
        message: `${data.senderName}: ${data.preview}`,
      });

      // Acknowledge delivery
      socket.emit("message-delivered", {
        messageId: data.messageId,
      });
    };

    socket.on("session-notification", handleSessionNotification);

    return () => {
      socket.off("session-notification", handleSessionNotification);
    };
  }, []);

  useEffect(() => {
    const handleCommunityNotification = (data: {
      messageId: number;
      communityId: number;
      communityName: string;
      senderName: string;
    }) => {
      console.log("COMMUNITY NOTIFICATION RECEIVED", data);
      setNotification({
        open: true,
        type: "community",
        sessionId: null,
        communityId: data.communityId,
        message: `${data.senderName} sent a message in ${data.communityName}`,
      });

      // Acknowledge delivery of the notification
      socket.emit("message-delivered", {
        messageId: data.messageId,
      });
    };

    socket.on("community-notification", handleCommunityNotification);

    return () => {
      socket.off(
        "community-notification",
        handleCommunityNotification
      );
    };
  }, []);
  useEffect(() => {
    const handleNewChat = (data: { sessionId: number }) => {
      setNotification({
        open: true,
        type: "session",
        sessionId: data.sessionId,
        communityId: null,
        message: "Your help request was accepted!",
      });
    };

    socket.on("new-chat", handleNewChat);

    return () => {
      socket.off("new-chat", handleNewChat);
    };
  }, []);
  useEffect(() => {
    const onConnect = () => {
      console.log("Connected:", socket.id);
    };

    const onDisconnect = (reason: string) => {
      console.log("Disconnected:", reason);
    };

    const onConnectError = (err: Error) => {
      console.log("Connection error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/me`, {
          withCredentials: true,
        });

        if (res.data.success && res.data.data?.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(res.data.data.user)
          );
          setIsAuth(true);
        } else {
          localStorage.removeItem("user");
          setIsAuth(false);
        }
      } catch (err) {
        localStorage.removeItem("user");
        setIsAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuth === null) {
    return <Loader />
  }

  return (
    <>
      <Snackbar
        open={notification.open}
        autoHideDuration={10000}
        onClose={() =>
          setNotification((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          sx={{
            width: 500,
            fontSize: "1rem",
            py: 1.5,
            px: 2,
            "& .MuiAlert-message": {
              fontSize: "1rem",
            },
          }}
          action={
            <Button
              color="inherit"
              onClick={() => {
                if (notification.sessionId) {
                  navigate(`/chat`);
                }
              }}
            >
              {notification.message}
            </Button>
          }
        >
          {notification.type}
        </Alert>
      </Snackbar>
      <Navbar
        checkAuth={isAuth}
        setCheckAuth={setIsAuth}
      />
      <Box sx={{ minHeight: "calc(100vh - 64px)", overflow: "hidden" }}>
        <Routes>
          <Route
            path="/"
            element={isAuth ? <FeedPage /> : <RegisterPage />}
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected example */}
          <Route
            path="/feed"
            element={isAuth ? <FeedPage /> : <LoginPage />}
          />

          <Route
            path="/create-community"
            element={isAuth ? <CommunityPage /> : <LoginPage />}
          />

          <Route
            // path="/chat/:session-id"
            path="/chat"
            element={isAuth ? <ChatPage /> : <LoginPage />}
          />
          <Route
            // path="/chat/:session-id"
            path="/helprequest"
            element={isAuth ? <HelpRequestForm /> : <LoginPage />}
          />
          <Route
            // path="/chat/:session-id"
            path="/help-request/:id"
            element={isAuth ? <PostPage /> : <LoginPage />}
          />
          <Route
            // path="/chat/:session-id"
            path="/explorecommunities"
            element={isAuth ? <ExploreCommunities /> : <LoginPage />}

          />
          <Route path="/profile" element={isAuth ? <UserProfile /> : <LoginPage />} />
          <Route
            // path="/chat/:session-id"
            path="/explorecommunities/:slug"
            element={isAuth ? <CommunityInfo /> : <LoginPage />}
          />
        </Routes>

      </Box>
    </>
  );
};

export default App;