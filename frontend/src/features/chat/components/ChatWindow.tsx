import { useLayoutEffect, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import MessageBubble from "./MessageBubble";
import { chatColors, chatFonts } from "../theme/chatTheme";
import type { Message } from "../types";

interface Props {
    messages: Message[];
    loading: boolean;
    currentUserId: string;
    onStartCall?: (mode: "voice" | "video") => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

export default function ChatWindow({
    messages,
    loading,
    currentUserId,
    onStartCall,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isPrependingRef = useRef(false);
    const previousScrollHeightRef = useRef<number>(0);
    const previousFirstMessageIdRef = useRef<string | null>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const currentFirstId = messages[0]?.id || null;

        if (isPrependingRef.current && previousScrollHeightRef.current > 0) {
            // Anchor scroll position when older messages are prepended to top
            const heightDiff = container.scrollHeight - previousScrollHeightRef.current;
            container.scrollTop = heightDiff;
            isPrependingRef.current = false;
        } else if (!previousFirstMessageIdRef.current || previousFirstMessageIdRef.current === currentFirstId) {
            // Initial load or new message appended at bottom
            bottomRef.current?.scrollIntoView({ behavior: previousFirstMessageIdRef.current ? "smooth" : "auto" });
        }

        previousFirstMessageIdRef.current = currentFirstId;
        previousScrollHeightRef.current = container.scrollHeight;
    }, [messages]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (container.scrollTop < 80 && hasMore && !loadingMore && onLoadMore) {
            isPrependingRef.current = true;
            previousScrollHeightRef.current = container.scrollHeight;
            onLoadMore();
        }
    };

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
            ref={containerRef}
            onScroll={handleScroll}
            flex={1}
            overflow="auto"
            px={2}
            py={2}
            sx={{ bgcolor: chatColors.bg }}
        >
            {/* Top spinner when fetching older messages */}
            {loadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
                    <CircularProgress size={18} sx={{ color: chatColors.primary }} />
                </Box>
            )}

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
                        onStartCall={onStartCall}
                    />
                );
            })}
            <div ref={bottomRef} />
        </Box>
    );
}