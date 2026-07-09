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
import PostPage from "../features/posts/components/HelpRequestPage";
import CommunityPage from "../features/communities/communityPage";
import ExploreCommunities from "../features/communities/pages/explorecommunites";
import axios from 'axios';
import Loader from "../components/loader";
import CommunityInfo from "../features/communities/pages/communityInfo";
import UserProfile from "../features/profile/UserProfile";
const API = import.meta.env.VITE_BACKEND_URL;
const socket = io(API, {
  withCredentials: true,
});
const App = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const [notification, setNotification] = useState<{
    open: boolean;
    sessionId: number | null;
  }>({
    open: false,
    sessionId: null,
  });
  useEffect(() => {
    const handleNewChat = (data: { sessionId: number }) => {
      setNotification({
        open: true,
        sessionId: data.sessionId,
      });
    };

    socket.on("new-chat", handleNewChat);

    return () => {
      socket.off("new-chat", handleNewChat);
    };
  }, []);
  useEffect(() => {
    try {
      socket.on('connect', () => {
        //console.log("Fronend connected")
      })
    } catch (err) {
      console.log("server is down!", err)
    }

    return () => socket.off("connect")
  }, [])
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/me`, {
          withCredentials: true,
        });
        setIsAuth(res.data.success);
      } catch (err) {
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
              OPEN
            </Button>
          }
        >
          Your help request has been accepted!
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
          <Route path="/profile" element={isAuth ?<UserProfile />  : <LoginPage />} />
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