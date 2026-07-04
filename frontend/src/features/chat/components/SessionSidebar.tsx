import {
  Avatar,
  Box,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getSessions } from "../../../services/session.service";

type Session = {
  id: number;
  help_request_id: number;
  requester_id: number;
  helper_id: number;
  mode: "call" | "text" | null;
  start_time: string | null;
  end_time: string | null;
  status: "active" | "completed" | "cancelled";
};

type SessionSidebarProps = {

  onSelectSession: (session: Session) => void;
};

const SessionSidebar = ({
  onSelectSession,
}: SessionSidebarProps) => {

  const [sessions, setSessions] = useState<Session[]>([]);



useEffect(() => {
    const fetchSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
            
        } catch (err) {
            console.error(err);
        }
    };

    fetchSessions();
}, []);







  return (
    <Box
      sx={{
        width: 320,
        height: "100%",
        borderRight: "1px solid #ddd",
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

      <List>
        {sessions.map((session) => (
          <ListItemButton
            key={session.id}
            onClick={() => onSelectSession(session)}
          >
            <ListItemAvatar>
              {/* <Avatar>{session.name.charAt(0)}</Avatar> */}
            </ListItemAvatar>

            <ListItemText
            primary={session.id}
            // secondary={session.lastMessage}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default SessionSidebar;