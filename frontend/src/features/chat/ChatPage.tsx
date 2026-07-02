import { useMemo, useState } from "react";
import { Box, Paper } from "@mui/material";
import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { chatColors, chatRadii } from "./theme/chattheme";
import type { Message } from "./types";

// ─────────────────────────────────────────────────────────────────
// MOCK DATA — remove this block and wire up the real hooks instead:
//   const { history, loading } = useChatHistory(sessionId);
//   const { messages, sendMessage, connected } = useChatSocket(sessionId, currentUserId);
// ─────────────────────────────────────────────────────────────────
const CURRENT_USER_ID = "u_you";
const OTHER_USER = {
    name: "Priya Sharma",
    role: "helper" as const,
};
const INITIAL_MESSAGES: Message[] = [
    {
        id: "1",
        sessionId: "s1",
        senderId: OTHER_USER.name,
        content: "Hey, I saw your request — happy to help!",
        createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    },
    {
        id: "2",
        sessionId: "s1",
        senderId: OTHER_USER.name,
        content: "Where should I send it, and by when do you need it?",
        createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    },
    {
        id: "3",
        sessionId: "s1",
        senderId: CURRENT_USER_ID,
        content: "Thank you so much! Today evening works, no rush.",
        createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    },
];
// ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
    // TODO: read sessionId from useParams<{ sessionId: string }>()
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [connected] = useState(true); // TODO: from useChatSocket
    const loading = false; // TODO: from useChatHistory
    const curDate: number = Date.now()
    const sessionStartedAt = useMemo(
        () => new Date(curDate - 8 * 60_000).toISOString(),
        []
    );

    const handleSend = (content: string) => {
        // TODO: replace with socket emit — this just appends locally for preview
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
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                bgcolor: "#E4E9E3",
                p: { xs: 0, sm: 2 },
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    maxWidth: 480,
                    height: { xs: "100vh", sm: "88vh" },
                    borderRadius: { xs: 0, sm: `${chatRadii.panel}px` },
                    overflow: "hidden",
                    border: { sm: `1px solid ${chatColors.line}` },
                }}
            >
                <ChatHeader
                    otherUser={OTHER_USER}
                    requestTitle="Need help paying electricity bill"
                    amount={1500}
                    sessionStartedAt={sessionStartedAt}
                    connected={connected}
                />
                <ChatWindow
                    messages={messages}
                    loading={loading}
                    currentUserId={CURRENT_USER_ID}
                />
                <MessageInput onSend={handleSend} disabled={!connected} />
            </Paper>
        </Box>
    );
}