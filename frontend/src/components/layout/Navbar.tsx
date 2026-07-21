import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  CircularProgress,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import PersonIcon from '@mui/icons-material/Person';
import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  withCredentials: true,
  autoConnect: false,
});
type NavBarAuth = {
  checkAuth: boolean;
  setCheckAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
};

const Navbar = ({ checkAuth, setCheckAuth }: NavBarAuth) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const API = import.meta.env.VITE_BACKEND_URL;


  //conditional redering for profile icon and logout button

  const location = useLocation()

  const isProfilePage = location.pathname === "/profile"



  const handleLogout = async () => {


    setLoggingOut(true);
    socket.disconnect();

    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      setCheckAuth(false);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }


  };
  const iconStyle = {
    width: 46,
    height: 46,
    borderRadius: "12px",
    color: "#4B5563",
    backgroundColor: "transparent",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#EEF4FF",
      color: "#2563EB",
    },
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <Toolbar
        sx={{
          maxWidth: "1600px",
          width: "100%",
          mx: "auto",
          px: 4,
          minHeight: "72px",
        }}
      >
        {/* Logo */}

        <Typography
          component={NavLink}
          to="/"
          variant="h5"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            color: "#2563EB",
            textDecoration: "none",
            letterSpacing: ".5px",
          }}
        >
          Socious
        </Typography>

        {/* Navigation */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Tooltip title="Feed" arrow>
            <IconButton component={NavLink} to="/feed" sx={iconStyle}>
              <HomeRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chat" arrow>
            <IconButton component={NavLink} to="/chat" sx={iconStyle}>
              <ChatRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Community" arrow>
            <IconButton component={NavLink} to="/create-community" sx={iconStyle}>
              <GroupsRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Explore Communities" arrow>
            <IconButton component={NavLink} to="/explorecommunities" sx={iconStyle}>
              <TravelExploreRoundedIcon />
            </IconButton>
          </Tooltip>

          {checkAuth ? (
            isProfilePage ? (
              <Tooltip title="Logout" arrow>
                <IconButton
                  onClick={handleLogout}
                  disabled={loggingOut}
                  sx={iconStyle}
                >
                  {loggingOut ? (
                    <CircularProgress size={20} />
                  ) : (
                    <LogoutRoundedIcon />
                  )}
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Profile" arrow>
                <IconButton
                  component={NavLink}
                  to="/profile"
                  sx={iconStyle}
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <>
              <Tooltip title="Login" arrow>
                <IconButton component={NavLink} to="/login" sx={iconStyle}>
                  <LoginRoundedIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Sign Up" arrow>
                <IconButton component={NavLink} to="/register" sx={iconStyle}>
                  <PersonAddRoundedIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;