import { Box, Stack, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import {
  chatColors,
  chatFonts,
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

    const isSameDay = (
      d1: Date,
      d2: Date
    ) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const time = messageDate.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

    let datePart = "";

    if (isSameDay(messageDate, today)) {
      datePart = "Today";
    } else if (isSameDay(messageDate, yesterday)) {
      datePart = "Yesterday";
    } else {
      datePart = messageDate.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      );
    }

    return `${datePart}, ${time}`;
  };

  const isImage =
    message.messageType === "image";

  const isVideo =
    message.messageType === "video";

  const isMedia =
    isImage || isVideo;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems={
        isOwn
          ? "flex-end"
          : "flex-start"
      }
      sx={{
        mb: isLastInGroup
          ? 1.5
          : 0.3,
      }}
    >
      {/* Message bubble */}
      <Box
        sx={{
          maxWidth: isMedia
            ? 360
            : "75%",

          px: isMedia
            ? 0.75
            : 2,

          py: isMedia
            ? 0.75
            : 1.2,

          bgcolor: isOwn
            ? chatColors.primary
            : "#fff",

          color: isOwn
            ? "#fff"
            : chatColors.ink,

          border: isOwn
            ? "none"
            : `1px solid ${chatColors.line}`,

          boxShadow:
            "0 2px 8px rgba(0,0,0,.06)",

          borderRadius: 3,

          overflow: "hidden",

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
        {/* IMAGE */}
        {isImage &&
          message.mediaUrl && (
            <Box
              component="img"
              src={`${import.meta.env.VITE_BACKEND_URL}${message.mediaUrl}`}
              alt={
                message.mediaName ||
                "Image"
              }
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          )}

        {/* VIDEO */}
        {isVideo &&
          message.mediaUrl && (
            <Box
              component="video"
              src={`${import.meta.env.VITE_BACKEND_URL}${message.mediaUrl}`}
              controls
              preload="metadata"
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 320,
                borderRadius: 2,
                backgroundColor: "#000",
              }}
            />
          )}

        {/* Caption / text */}
        {message.content && (
          <Typography
            sx={{
              fontFamily:
                chatFonts.body,
              fontSize: 14.5,
              lineHeight: 1.6,
              whiteSpace:
                "pre-wrap",
              wordBreak:
                "break-word",

              px: isMedia
                ? 0.75
                : 0,

              pt: isMedia
                ? 0.75
                : 0,

              pb: isMedia
                ? 0.25
                : 0,
            }}
          >
            {message.content}
          </Typography>
        )}

        {/* Fallback for media with no URL */}
        {isMedia &&
          !message.mediaUrl && (
            <Typography
              sx={{
                fontFamily:
                  chatFonts.body,
                fontSize: 13,
                color: isOwn
                  ? "#fff"
                  : chatColors.inkSoft,
                px: 1,
                py: 1,
              }}
            >
              Unable to load media
            </Typography>
          )}

        {/* Unknown media type fallback */}
        {!isImage &&
          !isVideo &&
          message.messageType !==
            "text" && (
            <Typography
              sx={{
                fontFamily:
                  chatFonts.body,
                fontSize: 13,
                color: isOwn
                  ? "#fff"
                  : chatColors.inkSoft,
              }}
            >
              {message.mediaName ||
                "Attachment"}
            </Typography>
          )}
      </Box>

      {/* Timestamp + read/delivery status */}
      {showTimestamp && (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent={
            isOwn
              ? "flex-end"
              : "flex-start"
          }
          sx={{
            mt: 0.5,
            px: 0.5,
          }}
        >
          <Typography
            sx={{
              fontFamily:
                chatFonts.mono,
              fontSize: 11,
              color:
                chatColors.inkSoft,
            }}
          >
            {getDateTimeLabel(
              message.createdAt
            )}
          </Typography>

          {isOwn &&
            (message.isRead ? (
              <DoneAllIcon
                sx={{
                  fontSize: 14,
                  color:
                    "#42A5F5",
                }}
              />
            ) : message.isDelivered ? (
              <DoneAllIcon
                sx={{
                  fontSize: 14,
                  color:
                    chatColors.inkSoft,
                }}
              />
            ) : (
              <DoneIcon
                sx={{
                  fontSize: 14,
                  color:
                    chatColors.inkSoft,
                  opacity: 0.8,
                }}
              />
            ))}
        </Stack>
      )}
    </Box>
  );
}