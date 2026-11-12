import {
  Avatar,
  Box,
  CircularProgress,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getSessions } from "../../../services/session.service";
import type { Session } from "../../../types/session";
import {
  cacheSessionsPeers,
  getCachedSessions,
  setCachedSessions,
} from "../../../lib/userCache";

type SessionSidebarProps = {
  onSelectSession: (session: Session) => void;
  selectedSessionId?: number;
  activeSessionStatus?: string;
};

const SessionSidebar = ({ onSelectSession, selectedSessionId, activeSessionStatus }: SessionSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>(() => getCachedSessions() || []);
  const [isLoading, setIsLoading] = useState(() => !getCachedSessions()?.length);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
        setCachedSessions(data);
        cacheSessionsPeers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId && activeSessionStatus) {
      setSessions((prev) =>
        prev.map((s) =>
          Number(s.id) === Number(selectedSessionId)
            ? { ...s, status: activeSessionStatus as Session["status"] }
            : s
        )
      );
    }
  }, [selectedSessionId, activeSessionStatus]);

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 330 },
        minWidth: { xs: 0, md: 330 },
        flexShrink: 0,
        height: "100%",
        borderRight: { xs: 0, md: "1px solid" },
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          minHeight: 69,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Your help conversations
        </Typography>
      </Box>
      {isLoading ? (
        <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
          <CircularProgress size={26} />
        </Box>
      ) : (
        <List sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 1 }}>
          {sessions.map((session) => (
            <ListItemButton
              key={session.id}
              onClick={() => onSelectSession(session)}
              selected={selectedSessionId === session.id}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: "10px",
                py: 1.25,
                "&.Mui-selected": { bgcolor: "action.selected", "&:hover": { bgcolor: "action.selected" } },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={
                    session.peer_avatar
                      ? session.peer_avatar.startsWith("http")
                        ? session.peer_avatar
                        : `${import.meta.env.VITE_BACKEND_URL}${session.peer_avatar}`
                      : undefined
                  }
                  sx={{ bgcolor: "action.selected", color: "primary.main", fontWeight: 600 }}
                >
                  {(session.peer_name || session.title || "S").charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={session.title}
                secondary={
                  session.status === "active"
                    ? (session.peer_name ? `${session.peer_name} • Active` : "Active conversation")
                    : "Completed"
                }
                primaryTypographyProps={{ noWrap: true, fontWeight: 600, fontSize: 14 }}
                secondaryTypographyProps={{
                  noWrap: true,
                  fontSize: 12.5,
                  color: session.status === "active" ? "text.secondary" : "text.disabled",
                }}
              />
            </ListItemButton>
          ))}
          {!sessions.length && (
            <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2">
                No conversations yet.
              </Typography>
              <Typography color="text.disabled" variant="caption" sx={{ display: "block", mt: 0.5 }}>
                Accepted help requests will appear here.
              </Typography>
            </Box>
          )}
        </List>
      )}
    </Box>
  );
};

export default SessionSidebar;
