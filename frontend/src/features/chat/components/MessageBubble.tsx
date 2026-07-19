import { Box, Stack, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import {
    chatColors,
    chatFonts,
    chatRadii,
} from "../../chat/theme/chatTheme";

import type { Message } from "../types";

interface Props {
    message: Message;
    isOwn: boolean;
    isLastInGroup: boolean;
    showTimestamp: boolean;
}

export default function CommunityChatBubble({
    message,
    isOwn,
    isLastInGroup,
    showTimestamp,
}: Props) {
    const getDateTimeLabel = (createdAt: string) => {
        const messageDate = new Date(createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const isSameDay = (d1: Date, d2: Date) =>
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();

        const time = messageDate.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        let datePart = "";

        if (isSameDay(messageDate, today))
            datePart = "Today";
        else if (isSameDay(messageDate, yesterday))
            datePart = "Yesterday";
        else
            datePart = messageDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            });

        return `${datePart}, ${time}`;
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems={isOwn ? "flex-end" : "flex-start"}
            sx={{
                mb: isLastInGroup ? 1.5 : 0.3,
            }}
        >
            <Box
                sx={{
                    maxWidth: "100%",
                    px: 2,
                    py: 1.2,

                    bgcolor: isOwn ? chatColors.primary : "#fff",

                    color: isOwn ? "#fff" : chatColors.ink,

                    border: isOwn
                        ? "none"
                        : `1px solid ${chatColors.line}`,

                    boxShadow: "0 2px 8px rgba(0,0,0,.06)",

                    borderRadius: 3,

                    ...(isLastInGroup
                        ? isOwn
                            ? {
                                borderBottomRightRadius: 8,
                            }
                            : {
                                borderBottomLeftRadius: 8,
                            }
                        : {}),
                }}
            >
                <Typography
                    sx={{
                        fontFamily: chatFonts.body,
                        fontSize: 14.5,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {message.content}
                </Typography>
            </Box>

            <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                justifyContent={isOwn ? "flex-end" : "flex-start"}
                sx={{
                    mt: 0.5,
                    px: 0.5,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: chatFonts.mono,
                        fontSize: 11,
                        color: chatColors.inkSoft,
                    }}
                >
                    {getDateTimeLabel(message.createdAt)}
                </Typography>

                {isOwn &&
                    (message.isRead ? (
                        <DoneAllIcon
                            sx={{
                                fontSize: 14,
                                color: "#42A5F5",
                            }}
                        />
                    ) : message.isDelivered ? (
                        <DoneAllIcon
                            sx={{
                                fontSize: 14,
                                color: chatColors.inkSoft,
                            }}
                        />
                    ) : (
                        <DoneIcon
                            sx={{
                                fontSize: 14,
                                color: chatColors.inkSoft,
                                opacity: 0.8,
                            }}
                        />
                    ))}
            </Stack>
        </Box>
    );
}