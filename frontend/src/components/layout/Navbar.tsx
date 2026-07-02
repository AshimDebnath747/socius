import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Toolbar,
  Typography,
} from "@mui/material";

type navBarAuth = {
  checkAuth: boolean;
  setCheckAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
};

const Navbar = ({ checkAuth, setCheckAuth }: navBarAuth) => {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  const API = import.meta.env.VITE_BACKEND_URL;

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      setCheckAuth(false);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
        >
          Socious
        </Typography>

        <Box>
          <Button color="inherit" component={RouterLink} to="/feed">
            Feed
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/chat"
          >
            Chat
          </Button>

          <Button
            color="inherit"
            component={RouterLink}
            to="/create-community"
          >
            Create Community
          </Button>

          {checkAuth ? (
            <Button
              color="inherit"
              onClick={handleLogout}
              disabled={loggingOut}
              startIcon={
                loggingOut ? (
                  <CircularProgress size={18} color="inherit" />
                ) : null
              }
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
              >
                Login
              </Button>

              <Button
                variant="outlined"
                color="inherit"
                component={RouterLink}
                to="/register"
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;