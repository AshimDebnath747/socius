import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAppColorMode } from "../../styles/colorModeContext";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import PersonIcon from "@mui/icons-material/Person";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  withCredentials: true,
  autoConnect: false,
});

type NavBarAuth = {
  checkAuth: boolean;
  setCheckAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
};

const links = [
  { label: "Feed", path: "/feed", icon: <HomeRoundedIcon /> },
  { label: "Chats", path: "/chat", icon: <ChatRoundedIcon /> },
  { label: "Communities", path: "/create-community", icon: <GroupsRoundedIcon /> },
  { label: "Explore", path: "/explorecommunities", icon: <TravelExploreRoundedIcon /> },
];

const Navbar = ({ checkAuth, setCheckAuth }: NavBarAuth) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const { mode, toggleMode } = useAppColorMode();
  const API = import.meta.env.VITE_BACKEND_URL;
  const isProfilePage = location.pathname === "/profile";
  const isMeetingPage = location.pathname.startsWith("/meeting/");

  useEffect(() => {
    let lastScrollTop = window.scrollY;
    const handleScroll = (event: Event) => {
      if (!window.matchMedia("(max-width: 899px)").matches) {
        setMobileNavHidden(false);
        return;
      }

      const target = event.target;
      const scrollTop = target instanceof HTMLElement ? target.scrollTop : window.scrollY;
      setMobileNavHidden(scrollTop > lastScrollTop && scrollTop > 64);
      lastScrollTop = scrollTop;
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  const isActive = (path: string) => path === "/feed"
    ? location.pathname === "/" || location.pathname.startsWith("/feed")
    : location.pathname.startsWith(path);

  const handleLogout = async () => {
    setLoggingOut(true);
    socket.disconnect();
    try {
      await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
      localStorage.removeItem("user");
      setCheckAuth(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navButtonSx = (active: boolean) => ({
    px: 1.5,
    color: active ? "primary.main" : "text.secondary",
    bgcolor: active ? "action.selected" : "transparent",
    minWidth: 0,
    "&:hover": { bgcolor: active ? "action.selected" : "action.hover" },
  });

  return (
    <>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", zIndex: 1100, transform: { xs: mobileNavHidden ? "translateY(-110%)" : "translateY(0)", md: "translateY(0)" }, transition: "transform 180ms ease", willChange: { xs: "transform", md: "auto" } }}>
        <Toolbar sx={{ minHeight: { xs: 58, sm: 68 }, width: "100%", maxWidth: 1440, mx: "auto", px: { xs: 2, sm: 3 } }}>
          <Typography
            component={NavLink}
            to="/"
            sx={{ color: "primary.main", textDecoration: "none", fontWeight: 700, fontSize: 23, letterSpacing: "-0.06em", mr: { xs: 0, md: 5 } }}
          >
            socious
          </Typography>

          {checkAuth && (
            <Box component="nav" aria-label="Main navigation" sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, alignItems: "center", flex: 1 }}>
              {links.map((link) => (
                <Button
                  key={link.path}
                  component={NavLink}
                  to={link.path}
                  startIcon={link.icon}
                  sx={navButtonSx(isActive(link.path))}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, ml: "auto" }}>
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton
                aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={toggleMode}
                sx={{ color: "text.secondary" }}
              >
                {mode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>
            {checkAuth ? (
              isProfilePage ? (
                <Tooltip title="Sign out">
                  <span>
                    <IconButton onClick={handleLogout} disabled={loggingOut} aria-label="Sign out" sx={{ color: "text.secondary" }}>
                      {loggingOut ? <CircularProgress size={20} /> : <LogoutRoundedIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Your profile">
                  <IconButton component={NavLink} to="/profile" aria-label="Your profile" sx={{ p: 0.4 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "action.selected", color: "primary.main" }}><PersonIcon fontSize="small" /></Avatar>
                  </IconButton>
                </Tooltip>
              )
            ) : (
              <>
                <Button component={NavLink} to="/login" startIcon={<LoginRoundedIcon />} sx={{ color: "text.secondary" }}>Sign in</Button>
                <Button component={NavLink} to="/register" variant="contained" startIcon={<PersonAddRoundedIcon />}>Create account</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {checkAuth ? (isMeetingPage ? null : (
        <Paper
          component="nav"
          aria-label="Mobile navigation"
          square
          elevation={4}
          sx={{
            display: { xs: "grid", md: "none" },
            position: "fixed",
            zIndex: 1200,
            left: 0,
            right: 0,
            bottom: 0,
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            pb: "env(safe-area-inset-bottom)",
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            backdropFilter: "blur(16px)",
          }}
        >
          {[...links, { label: "Profile", path: "/profile", icon: <PersonIcon /> }].map((link) => (
            <Button
              key={link.path}
              component={NavLink}
              to={link.path}
              sx={{
                minWidth: 0,
                minHeight: 58,
                p: 0.5,
                borderRadius: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                color: isActive(link.path) ? "primary.main" : "text.secondary",
                "& .MuiButton-startIcon": { m: 0 },
                "&:hover": { bgcolor: "transparent" },
              }}
              startIcon={link.icon}
            >
              <Typography component="span" sx={{ fontSize: 10, lineHeight: 1.1, fontWeight: isActive(link.path) ? 700 : 500 }} noWrap>{link.label}</Typography>
            </Button>
          ))}
        </Paper>
      )) : (
        <Paper component="nav" aria-label="Account navigation" square sx={{ display: { xs: "flex", md: "none" }, position: "fixed", zIndex: 1200, left: 0, right: 0, bottom: 0, p: 1, gap: 1, pb: "calc(8px + env(safe-area-inset-bottom))", borderTop: "1px solid", borderColor: "divider" }}>
          <Button fullWidth component={NavLink} to="/login" startIcon={<LoginRoundedIcon />} variant="outlined">Sign in</Button>
          <Button fullWidth component={NavLink} to="/register" startIcon={<PersonAddRoundedIcon />} variant="contained">Create account</Button>
        </Paper>
      )}
    </>
  );
};

export default Navbar;
