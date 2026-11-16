import { Box, Typography } from "@mui/material";
import { chatColors, chatFonts } from "../theme/chatTheme";

interface TypingIndicatorProps {
  text: string;
}

export default function TypingIndicator({ text }: TypingIndicatorProps) {
  if (!text) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2.5,
        py: 0.75,
        bgcolor: chatColors.surface,
        borderTop: `1px solid ${chatColors.line}`,
        animation: "typingFadeIn 200ms ease-out",
        "@keyframes typingFadeIn": {
          from: { opacity: 0, transform: "translateY(4px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, pl: 0.25 }}>
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            bgcolor: chatColors.primary,
            animation: "typingDot 1.4s infinite ease-in-out",
            animationDelay: "0ms",
            "@keyframes typingDot": {
              "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
              "40%": { transform: "scale(1.2)", opacity: 1 },
            },
          }}
        />
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            bgcolor: chatColors.primary,
            animation: "typingDot 1.4s infinite ease-in-out",
            animationDelay: "200ms",
          }}
        />
        <Box
          sx={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            bgcolor: chatColors.primary,
            animation: "typingDot 1.4s infinite ease-in-out",
            animationDelay: "400ms",
          }}
        />
      </Box>
      <Typography
        sx={{
          fontFamily: chatFonts.body,
          fontSize: 12,
          color: chatColors.inkSoft,
          fontStyle: "italic",
          fontWeight: 500,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
