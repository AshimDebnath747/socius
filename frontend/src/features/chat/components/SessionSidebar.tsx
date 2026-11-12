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

type SessionSidebarProps = {
  onSelectSession: (session: Session) => void;
  selectedSessionId?: number;
};

const SessionSidebar = ({ onSelectSession, selectedSessionId }: SessionSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessions(await getSessions());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <Box sx={{ width: { xs: "100%", md: 340 }, flexShrink: 0, height: "100%", borderRight: { xs: 0, md: "1px solid" }, borderColor: "divider", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h5">Messages</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Your help conversations</Typography>
      </Box>
      {isLoading ? (
        <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}><CircularProgress size={26} /></Box>
      ) : (
        <List sx={{ flex: 1, overflowY: "auto", py: 1 }}>
          {sessions.map((session) => (
            <ListItemButton
              key={session.id}
              onClick={() => onSelectSession(session)}
              selected={selectedSessionId === session.id}
              sx={{ mx: 1, my: 0.5, borderRadius: "10px", py: 1.25, "&.Mui-selected": { bgcolor: "action.selected", "&:hover": { bgcolor: "action.selected" } } }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "action.selected", color: "primary.main", fontWeight: 600 }}>{session.title.charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={session.title} secondary={session.status === "active" ? "Active conversation" : session.status} primaryTypographyProps={{ noWrap: true, fontWeight: 600 }} secondaryTypographyProps={{ noWrap: true }} />
            </ListItemButton>
          ))}
          {!sessions.length && <Typography color="text.secondary" sx={{ px: 3, py: 4, textAlign: "center" }}>No conversations yet.</Typography>}
        </List>
      )}
    </Box>
  );
};

export default SessionSidebar;
