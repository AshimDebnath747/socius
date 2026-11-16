import { useLayoutEffect, useRef } from "react";
import { Box, CircularProgress, Typography, Avatar, Stack } from "@mui/material";
import CommunityChatBubble from "./CommunityChatBubble";
import { chatColors, chatFonts } from "../../chat/theme/chatTheme";
import type { CommunityMessage } from "../../../types/community";

const API = import.meta.env.VITE_BACKEND_URL;

interface Props {
    messages: CommunityMessage[];
    loading: boolean;
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

export default function CommunityChatWindow({
    messages,
    loading,
    currentUserId,
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
            <Box
                flex={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <CircularProgress
                    size={22}
                    sx={{ color: chatColors.primary }}
                />
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
            sx={{
                bgcolor: chatColors.bg,
            }}
        >
            {/* Top spinner when fetching older messages */}
            {loadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
                    <CircularProgress size={18} sx={{ color: chatColors.primary }} />
                </Box>
            )}

            {messages.map((msg, i) => {
                const next = messages[i + 1];
                const prev = messages[i - 1];

                const isOwn = String(msg.senderId) === currentUserId;

                const isFirstInGroup =
                    !prev || prev.senderId !== msg.senderId;

                const isLastInGroup =
                    !next || next.senderId !== msg.senderId;

                return (
                    <Stack
                        key={msg.id}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                        justifyContent={
                            isOwn ? "flex-end" : "flex-start"
                        }
                        mb={0.5}
                    >
                        {!isOwn && (
                            <>
                                {isFirstInGroup ? (
                                    <Avatar
                                        src={
                                            msg.avatar
                                                ? msg.avatar.startsWith("http")
                                                    ? msg.avatar
                                                    : `${API}${msg.avatar}`
                                                : undefined
                                        }
                                        sx={{
                                            width: 36,
                                            height: 36,
                                        }}
                                    >
                                        {msg.name?.charAt(0)}
                                    </Avatar>
                                ) : (
                                    <Box width={36} />
                                )}
                            </>
                        )}

                        <Box maxWidth="75%">
                            {!isOwn && isFirstInGroup && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        ml: 1,
                                        color: "text.secondary",
                                        fontWeight: 600,
                                    }}
                                >
                                    {msg.name}
                                </Typography>
                            )}

                            <CommunityChatBubble
                                message={msg}
                                isOwn={isOwn}
                                isLastInGroup={isLastInGroup}
                                showTimestamp={isLastInGroup}
                            />
                        </Box>
                    </Stack>
                );
            })}

            <div ref={bottomRef} />
        </Box>
    );
}