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
        const handleDelivered = ({ messageId }: { messageId: string }) => {
            console.log("message delivered event hit on message id", messageId)
            setMessages(prev =>
                prev.map(msg =>
                    String(msg.id) === String(messageId)
                        ? {
                            ...msg,
                            isDelivered: true,
                        }
                        : msg
                )
            );

        };

        socket.on("message-delivered", handleDelivered);

        return () => {
            socket.off("message-delivered", handleDelivered);
        };
    }, []);

    useEffect(() => {

        const handleReceiveMessage = (msg: any) => {

            const message: Message = {
                id: String(msg.id),
                sessionId: String(msg.session_id),
                senderId: String(msg.sender_id),
                content: msg.content,
                createdAt: msg.created_at,
                isDelivered: msg.is_delivered,
                isRead: msg.is_read

            };
            console.log(message.createdAt);
            console.log(typeof message.createdAt);
            // console.log(message.createdAt instanceof Date);
            setMessages((prev) => [...prev, message]);
            socket.emit("message-delivered", {
                messageId: message.id,
            });
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
                    isRead: msg.is_read,
                    isDelivered: msg.is_delivered,
                    isDeleted: msg.is_deleted,
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
                minHeight: 0,
                overflow: "hidden",
            }}
        >
            <SessionSidebar
                onSelectSession={setSelectedSession}
            />

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    display: "flex",
                    overflow: "hidden",
                }}
            >
                {selectedSession ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            flex: 1,
                            minHeight: 0,
                            overflow: "hidden",
                        }}
                    >
                        <ChatHeader
                            otherUser={{
                                name: chatUser?.name || "Loading...",
                                role: chatUser?.role || "Loading...",
                                avatarUrl: chatUser?.avatar
                            }}
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
                                    type: "session",
                                    sessionId: selectedSession.id,
                                    content,
                                });
                            }}
                            disabled={!connected}
                        />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 0,
                        }}
                    >
                        <Typography variant="h5">
                            Select a conversation
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatPage;