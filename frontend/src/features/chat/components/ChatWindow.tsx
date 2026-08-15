import { useEffect, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import MessageBubble from "./MessageBubble";
import { chatColors, chatFonts } from "../theme/chatTheme";
import type { Message } from "../types";

interface Props {
    messages: Message[];
    loading: boolean;
    currentUserId: string;
}

export default function ChatWindow({ messages, loading, currentUserId }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    if (loading) {
        return (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                <CircularProgress size={22} sx={{ color: chatColors.primary }} />
            </Box>
        );
    }

    if (messages.length === 0) {
        return (
            <Box
                flex={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={4}
            >
                <Typography
                    sx={{
                        fontFamily: chatFonts.body,
                        fontSize: 14,
                        color: chatColors.inkSoft,
                        textAlign: "center",
                    }}
                >
                    No messages yet. Say hello to get started.
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            flex={1}
            overflow="auto"
            px={2}
            py={2}
            sx={{ bgcolor: chatColors.bg }}
        >
            {messages.map((msg, i) => {
                const next = messages[i + 1];
                const isLastInGroup = !next || next.senderId !== msg.senderId;
                return (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={String(msg.senderId) === String(currentUserId)}
                        isLastInGroup={isLastInGroup}
                        showTimestamp={isLastInGroup}
                    />
                );
            })}
            <div ref={bottomRef} />
        </Box>
    );
}