import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { Box, Typography } from "@mui/material";
import SessionSidebar from "./components/SessionSidebar";
import { useEffect, useState } from "react";
import type { Session } from "../../types/session";
import { getNextUserById } from "../../services/user.service";


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
 const [chatUser, setChatUser] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

const connected = true;

const loading = false;


// Function to handle session selection

useEffect(() => {
    const fetchSessions = async () => {
        try {
          if (!selectedSession) return;
            const res = await getNextUserById(selectedSession.helper_id, selectedSession.requester_id);
            setChatUser(res);
            console.log("Fetched user:", res);
            
        } catch (err) {
            console.error(err);
        }
    };

    fetchSessions();
}, [selectedSession]);


  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
      }}
    >
      <SessionSidebar 
      
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
      name: chatUser?.name || "Loading...",
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