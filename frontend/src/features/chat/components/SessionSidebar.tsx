import {
  Avatar,
  Box,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

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
  sessions: Session[];
  onSelectSession: (session: Session) => void;
};

const SessionSidebar = ({
  sessions,
  onSelectSession,
}: SessionSidebarProps) => {
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
              // primary={session.name}
              // secondary={session.lastMessage}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default SessionSidebar;