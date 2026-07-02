import { type KeyboardEvent, useState } from "react";
import { Box, IconButton, InputBase } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { chatColors, chatFonts } from "../theme/chatTheme";

interface Props {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
    const [text, setText] = useState("");

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                px: 2,
                py: 1.5,
                bgcolor: chatColors.surface,
                borderTop: `1px solid ${chatColors.line}`,
            }}
        >
            <InputBase
                multiline
                maxRows={5}
                placeholder={disabled ? "Reconnecting…" : "Write a message"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                sx={{
                    flex: 1,
                    fontFamily: chatFonts.body,
                    fontSize: 14.5,
                    px: 2,
                    py: 1,
                    bgcolor: chatColors.bg,
                    borderRadius: "18px",
                    border: `1px solid ${chatColors.line}`,
                    "&.Mui-focused": {
                        borderColor: chatColors.primary,
                    },
                    transition: "border-color 120ms ease",
                }}
            />
            <IconButton
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                sx={{
                    bgcolor: text.trim() ? chatColors.primary : chatColors.line,
                    color: text.trim() ? "#FFFFFF" : chatColors.inkSoft,
                    width: 40,
                    height: 40,
                    "&:hover": {
                        bgcolor: text.trim() ? chatColors.primarySoft : chatColors.line,
                    },
                    transition: "background-color 120ms ease",
                }}
            >
                <SendRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
        </Box>
    );
}