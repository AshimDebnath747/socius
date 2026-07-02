import { Box, Typography } from "@mui/material";
import { chatColors, chatFonts, chatRadii } from "../theme/chatTheme";
import type { Message } from "../types";

interface Props {
    message: Message;
    isOwn: boolean;
    isLastInGroup: boolean; // last message from this sender before sender changes
    showTimestamp: boolean;
}

export default function MessageBubble({
    message,
    isOwn,
    isLastInGroup,
    showTimestamp,
}: Props) {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems={isOwn ? "flex-end" : "flex-start"}
            sx={{ mb: isLastInGroup ? 1 : 0.25 }}
        >
            <Box
                sx={{
                    maxWidth: "72%",
                    px: 1.75,
                    py: 1,
                    bgcolor: isOwn ? chatColors.primary : chatColors.surface,
                    color: isOwn ? "#FFFFFF" : chatColors.ink,
                    border: isOwn ? "none" : `1px solid ${chatColors.line}`,
                    borderRadius: `${chatRadii.bubble}px`,
                    ...(isLastInGroup
                        ? isOwn
                            ? { borderBottomRightRadius: chatRadii.bubbleTail }
                            : { borderBottomLeftRadius: chatRadii.bubbleTail }
                        : {}),
                }}
            >
                <Typography
                    sx={{
                        fontFamily: chatFonts.body,
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {message.content}
                </Typography>
            </Box>

            {showTimestamp && (
                <Typography
                    sx={{
                        fontFamily: chatFonts.mono,
                        fontSize: 11,
                        color: chatColors.inkSoft,
                        mt: 0.5,
                        px: 0.5,
                    }}
                >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Typography>
            )}
        </Box>
    );
}