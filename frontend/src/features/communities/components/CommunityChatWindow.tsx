import { useEffect, useRef } from "react";
import { Box, CircularProgress, Typography, Avatar, Stack } from "@mui/material";
import CommunityChatBubble from "./CommunityChatBubble";
import { chatColors, chatFonts } from "../../chat/theme/chatTheme";
import type { CommunityMessage } from "../../../types/community";

const API = import.meta.env.VITE_BACKEND_URL;

interface Props {
    messages: CommunityMessage[];
    loading: boolean;
    currentUserId: string;
}

export default function CommunityChatWindow({
    messages,
    loading,
    currentUserId,
}: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages.length]);

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
            flex={1}
            overflow="auto"
            px={2}
            py={2}
            sx={{
                bgcolor: chatColors.bg,
            }}
        >
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
                                                ? `${API}${msg.avatar}`
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