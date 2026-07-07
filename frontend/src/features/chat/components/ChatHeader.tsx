import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { chatColors, chatFonts } from "../theme/chatTheme";

export interface ChatHeaderProps {
    otherUser: {
        name: string;
        avatarUrl?: string;
        role: "requester" | "helper" | "click for more info";
        connected?: boolean;
    };

}


export default function ChatHeader({
    otherUser,
}: ChatHeaderProps) {


    return (
        <Box
            sx={{
                bgcolor: chatColors.surface,
                borderBottom: `1px solid ${chatColors.line}`,
                px: { xs: 2, sm: 3 },
                py: 1.5,
            }}
        >
            {/* Top row: who you're talking to */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ position: "relative" }}>
                    <Avatar
                        src={otherUser.avatarUrl}
                        sx={{ width: 40, height: 40, bgcolor: chatColors.primary }}
                    >
                        {otherUser.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: otherUser.connected ? chatColors.primary : chatColors.inkSoft,
                            border: `2px solid ${chatColors.surface}`,
                            "@media (prefers-reduced-motion: no-preference)": otherUser.connected
                                ? {
                                    animation: "chat-pulse 2s ease-in-out infinite",
                                }
                                : undefined,
                            "@keyframes chat-pulse": {
                                "0%, 100%": { boxShadow: `0 0 0 0 ${chatColors.primary}55` },
                                "50%": { boxShadow: `0 0 0 4px ${chatColors.primary}00` },
                            },
                        }}
                    />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontFamily: chatFonts.display,
                            fontWeight: 600,
                            fontSize: 16,
                            color: chatColors.ink,
                            lineHeight: 1.2,
                        }}
                        noWrap
                    >
                        {otherUser.name}
                    </Typography>
                    <Chip
                        label={otherUser.role === "helper"
                            ? "Helper"
                            : otherUser.role === "requester"
                                ? "Requester"
                                : "Click for more info"}
                        size="small"
                        sx={{
                            mt: 0.25,
                            height: 18,
                            fontSize: 11,
                            fontFamily: chatFonts.body,
                            fontWeight: 500,
                            bgcolor:
                                otherUser.role === "helper"
                                    ? chatColors.accentSoft
                                    : `${chatColors.primary}1A`,
                            color:
                                otherUser.role === "helper"
                                    ? chatColors.accent
                                    : chatColors.primary,
                            "& .MuiChip-label": { px: 1 },
                        }}
                    />
                </Box>
            </Stack>

            {/* Session strip — the signature element: keeps the money context visible
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{
                    mt: 1.25,
                    pt: 1.25,
                    borderTop: `1px dashed ${chatColors.line}`,
                }}
            >
                <Typography
                    noWrap
                    sx={{
                        fontFamily: chatFonts.body,
                        fontSize: 13,
                        color: chatColors.inkSoft,
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="baseline" flexShrink={0}>
                    <Typography
                        sx={{
                            fontFamily: chatFonts.mono,
                            fontSize: 13,
                            fontWeight: 500,
                            color: chatColors.accent,
                        }}
                    >
                        
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: chatFonts.mono,
                            fontSize: 12,
                            color: chatColors.inkSoft,
                        }}
                    >
                        
                    </Typography>
                </Stack> */}
            {/* </Stack> */}
        </Box>
    );
}