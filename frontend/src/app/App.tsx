import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";

import Navbar from "../components/layout/Navbar";
import WelcomePage from "../features/home/WelcomePage";
import FeedPage from "../features/posts/pages/FeedPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import CreateCommunityPage from "../features/communities/pages/CreateCommunityPage";

const API = import.meta.env.VITE_BACKEND_URL;

const App = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
        });

        setIsAuth(res.ok);
      } catch (err) {
        setIsAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuth === null) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Box>
        <Routes>
          {/* 🔥 MAIN LOGIC */}
          <Route
            path="/"
            element={isAuth ? <WelcomePage /> : <RegisterPage />}
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected example */}
          <Route
            path="/feed"
            element={isAuth ? <FeedPage /> : <RegisterPage />}
          />

          <Route
            path="/create-community"
            element={isAuth ? <CreateCommunityPage /> : <RegisterPage />}
          />
        </Routes>
      </Box>
    </BrowserRouter>
  );
};

export default App;