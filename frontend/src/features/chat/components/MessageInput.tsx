import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Box,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { chatColors, chatFonts } from "../theme/chatTheme";

interface Props {
  onSend: (text: string) => void;

  onSendMedia?: (
    file: File,
    caption: string
  ) => Promise<void>;

  onTyping?: () => void;
  onStopTyping?: () => void;

  disabled?: boolean;
}
export default function MessageInput({
  onSend,
  onSendMedia,
  onTyping,
  onStopTyping,
  disabled,
}: Props) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        onStopTyping?.();
      }
    };
  }, [onStopTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping?.();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onStopTyping?.();
      }, 2500);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        onStopTyping?.();
      }
    }
  };

  /*
   * Clean up the temporary object URL when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /*
   * Open the system file picker.
   */
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  /*
   * Validate and select the media file.
   */
  const handleFileChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  setSelectedFile(file);
  setPreviewUrl(URL.createObjectURL(file));

  e.target.value = "";
};

  /*
   * Remove selected media.
   */
  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaError(null);
  };

  /*
   * Send normal text message.
   *
   * Media sending will be connected later
   * when we integrate the upload API + Socket.IO.
   */
 const handleSend = async () => {
  const trimmed = text.trim();

  if (isTypingRef.current) {
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onStopTyping?.();
  }

  try {
    /*
     * Send media.
     */

    if (selectedFile && onSendMedia) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      await onSendMedia(
        selectedFile,
        trimmed
      );

      setSelectedFile(null);
      setPreviewUrl(null);

      setText("");

      return;
    }

    /*
     * Send text.
     */

    if (!trimmed) {
      return;
    }

    onSend(trimmed);

    setText("");
  } catch (err) {
    console.error(err);
  }
};

  /*
   * Enter sends the message.
   * Shift + Enter creates a new line.
   */
  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = Boolean(
    text.trim() || selectedFile
  );

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: chatColors.surface,
        borderTop: `1px solid ${chatColors.line}`,
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
        onChange={handleFileChange}
        hidden
      />

      {/* Media validation error */}
      {mediaError && (
        <Box
          sx={{
            px: 2,
            pt: 1,
          }}
        >
          <Typography
            sx={{
              fontFamily: chatFonts.body,
              fontSize: 12.5,
              color: "#d32f2f",
            }}
          >
            {mediaError}
          </Typography>
        </Box>
      )}

      {/* Media preview */}
      {selectedFile && previewUrl && (
        <Box
          sx={{
            px: 2,
            pt: 1.5,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 360,
              height: 200,
              overflow: "hidden",
              borderRadius: "10px",
              bgcolor: "#000",
              border: `1px solid ${chatColors.line}`,
            }}
          >
            {/* Image preview */}
            {selectedFile.type.startsWith("image/") && (
              <Box
                component="img"
                src={previewUrl}
                alt={selectedFile.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            )}

            {/* Video preview */}
            {selectedFile.type.startsWith("video/") && (
              <Box
                component="video"
                src={previewUrl}
                controls
                preload="metadata"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            )}

            {/* Remove button */}
            <IconButton
              onClick={handleRemoveFile}
              disabled={disabled}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                bgcolor: "rgba(0, 0, 0, 0.6)",
                color: "#FFFFFF",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* File information */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 0.75,
              mb: 0.5,
              maxWidth: 360,
            }}
          >
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: chatFonts.body,
                  fontSize: 12.5,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedFile.name}
              </Typography>

              <Typography
                sx={{
                  fontFamily: chatFonts.body,
                  fontSize: 11,
                  color: chatColors.inkSoft,
                }}
              >
                {(
                  selectedFile.size /
                  (1024 * 1024)
                ).toFixed(2)}{" "}
                MB
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Input row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          px: 2,
          py: 1.5,
        }}
      >
        {/* Attachment button */}
        <IconButton
          onClick={handleAttachmentClick}
          disabled={disabled}
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            color: chatColors.inkSoft,
            "&:hover": {
              color: chatColors.primary,
              bgcolor: chatColors.bg,
            },
          }}
        >
          <AttachFileRoundedIcon
            sx={{ fontSize: 21 }}
          />
        </IconButton>

        {/* Message / Caption input */}
        <InputBase
          multiline
          maxRows={5}
          placeholder={
            disabled
              ? "Reconnecting…"
              : selectedFile
                ? "Add a caption..."
                : "Write a message"
          }
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          sx={{
            flex: 1,
            minWidth: 0,
            fontFamily: chatFonts.body,
            fontSize: 14.5,
            px: 2,
            py: 1,
            bgcolor: chatColors.bg,
            borderRadius: "10px",
            border: `1px solid ${chatColors.line}`,
            "&.Mui-focused": {
              borderColor: chatColors.primary,
            },
            transition:
              "border-color 120ms ease",
          }}
        />

        {/* Send button */}
        <IconButton
          onClick={handleSend}
          disabled={
            disabled || !canSend
          }
          sx={{
            bgcolor:
              canSend
                ? chatColors.primary
                : chatColors.line,
            color:
              canSend
                ? chatColors.onPrimary
                : chatColors.inkSoft,
            width: 40,
            height: 40,
            flexShrink: 0,
            "&:hover": {
              bgcolor:
                canSend
                  ? chatColors.primarySoft
                  : chatColors.line,
            },
            transition:
              "background-color 120ms ease",
          }}
        >
          <SendRoundedIcon
            sx={{ fontSize: 19 }}
          />
        </IconButton>
      </Box>
    </Box>
  );
}
