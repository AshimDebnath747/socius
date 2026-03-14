import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "../components/layout/Navbar";
import WelcomePage from "../features/home/WelcomePage";
import FeedPage from "../features/posts/pages/FeedPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import CreateCommunityPage from "../features/communities/pages/CreateCommunityPage";

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Box>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create-community" element={<CreateCommunityPage />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
};

export default App;