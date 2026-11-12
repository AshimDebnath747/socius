import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { chatColors, chatFonts } from "../theme/chatTheme";
import type { ChatHeaderProps } from "../../posts/types";

export default function ChatHeader({ otherUser, onClick, badge }: ChatHeaderProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: chatColors.surface,
        borderBottom: `1px solid ${chatColors.line}`,
        px: { xs: 2, sm: 3 },
        py: 1.5,
      }}
    >
      {/* Top row: who you're talking to */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <Avatar
            src={
              otherUser.avatarUrl
                ? `${import.meta.env.VITE_BACKEND_URL}${otherUser.avatarUrl}`
                : undefined
            }
            sx={{ width: 40, height: 40, bgcolor: chatColors.primary }}
          >
            {otherUser.name.charAt(0).toUpperCase()}
          </Avatar>
          {otherUser.connected && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#22c55e",
                border: "2px solid",
                borderColor: "background.paper",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
                "@media (prefers-reduced-motion: no-preference)": {
                  animation: "online-pulse 2s ease-in-out infinite",
                },
                "@keyframes online-pulse": {
                  "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.45)" },
                  "50%": { boxShadow: "0 0 0 4px rgba(34, 197, 94, 0)" },
                },
              }}
            />
          )}
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
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
            <Chip
              label={
                otherUser.role === "helper"
                  ? "Helper"
                  : otherUser.role === "requester"
                    ? "Requester"
                    : "Click for more info"
              }
              size="small"
              sx={{
                height: 18,
                fontSize: 11,
                fontFamily: chatFonts.body,
                fontWeight: 500,
                bgcolor:
                  otherUser.role === "helper"
                    ? chatColors.accentSoft
                    : chatColors.primarySoft,
                color:
                  otherUser.role === "helper"
                    ? chatColors.accent
                    : chatColors.primary,
                "& .MuiChip-label": { px: 1 },
              }}
            />
            {badge}
          </Stack>
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
