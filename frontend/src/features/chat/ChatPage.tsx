import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { Box, Typography } from "@mui/material";
import SessionSidebar from "./components/SessionSidebar";
import { useEffect, useState } from "react";
import type { Session } from "../../types/session";
import { getNextUserById } from "../../services/user.service";
import { io } from 'socket.io-client'
import { type Message } from "./types";
import axios from 'axios';
const API = import.meta.env.VITE_BACKEND_URL;
const socket = io(API, {
    withCredentials: true,
});
const user: string | null = localStorage.getItem("user")
console.log("user :", user)
let CURRENT_USER_ID: string = ""
if (user) CURRENT_USER_ID = String(JSON.parse(user).id);
console.log(CURRENT_USER_ID)


const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatUser, setChatUser] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const connected = true;

    const loading = false;

    useEffect(() => {

        const handleReceiveMessage = (msg: any) => {
            //console.log(msg)
            const message: Message = {
                id: String(msg.id),
                sessionId: String(msg.session_id),
                senderId: String(msg.sender_id),
                content: msg.content,
                createdAt: msg.created_at,
            };

            setMessages((prev) => [...prev, message]);
        };
        socket.on("receive-message", handleReceiveMessage);
        return () => {
            socket.off("receive-message", handleReceiveMessage);
        };
    }, []);
    // Function to handle session selection

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                if (!selectedSession) return;
                console.log("selected session:", selectedSession.id)

                const msg = await axios.get(`${API}/api/sessions/${selectedSession.id}/messages`, {
                    withCredentials: true
                });

                console.log(msg.data)
                const messages: Message[] = msg.data?.data?.map((msg: any) => ({
                    id: String(msg.id),
                    sessionId: String(msg.session_id),
                    senderId: String(msg.sender_id),
                    content: msg.content,
                    createdAt: msg.created_at,
                }));
                setMessages(messages);
                socket.emit("join-session", selectedSession.id);
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
                                if (!selectedSession) return;

                                socket.emit("send-message", {
                                    sessionId: selectedSession.id,
                                    content,
                                });
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