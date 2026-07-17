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
};

const SessionSidebar = ({
  onSelectSession,
}: SessionSidebarProps) => {

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);

      try {
        const data = await getSessions();
        setSessions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);







  return (
    <Box
  sx={{
    width: 320,
    height: "100%", // use 100% so it respects the parent container height
    borderRight: "1px solid #ddd",
    display: "flex",
    flexDirection: "column",
  }}
>
  <Typography
    variant="h5"
    sx={{
      p: 2,
      borderBottom: "1px solid #ddd",
      fontWeight: "bold",
    }}
  >
    Chats
  </Typography>

  {isLoading ? (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  ) : (
    <List
      sx={{
        flex: 1,
        overflowY: "auto",
      }}
    >
      {sessions.map((session) => (
        <ListItemButton
          key={session.id}
          onClick={() => onSelectSession(session)}
        >
          <ListItemAvatar>
            <Avatar>{session.urgency.charAt(0)}</Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={session.title}
            secondary={session.urgency}
          />
        </ListItemButton>
      ))}
    </List>
  )}
</Box>
  );
};

export default SessionSidebar;