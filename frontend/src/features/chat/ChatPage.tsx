import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { Box, Typography } from "@mui/material";
import SessionSidebar from "./components/SessionSidebar";
import { useEffect, useState } from "react";
import { getSessions } from "../../services/session.service";


const CURRENT_USER_ID = "u_you";

const OTHER_USER = {
  name: "Priya Sharma",
  role: "helper" as const,
};

const INITIAL_MESSAGES = [
  {
    id: "1",
    sessionId: "s1",
    senderId: OTHER_USER.name,
    content: "Hey, I saw your request — happy to help!",
    createdAt: new Date().toISOString(),
  },
];

const ChatPage = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

const connected = true;

const loading = false;





  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
      }}
    >
      <SessionSidebar 
      sessions={sessions}
      onSelectSession={setSelectedSession}
      
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {selectedSession ? (
          <Box
  sx={{
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  }}
>
  <ChatHeader
    otherUser={{
      name: selectedSession.name,
      role: "helper",
    }}
    requestTitle="Electricity Bill"
    amount={1500}
    sessionStartedAt={new Date().toISOString()}
    connected={connected}
  />

  <ChatWindow
    messages={messages}
    loading={loading}
    currentUserId={CURRENT_USER_ID}
  />

  <MessageInput
    onSend={(content) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sessionId: "s1",
          senderId: CURRENT_USER_ID,
          content,
          createdAt: new Date().toISOString(),
        },
      ]);
    }}
    disabled={!connected}
  />
</Box>
        ) : (
          <Typography variant="h5">
            Select a conversation
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;