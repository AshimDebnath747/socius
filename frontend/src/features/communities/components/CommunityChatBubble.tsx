import { Box, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import {
  chatColors,
  chatFonts,
} from "../../chat/theme/chatTheme";

import { type CommunityMessage } from "../../../types/community";

const API = import.meta.env.VITE_BACKEND_URL;

interface Props {
  message: CommunityMessage;
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

    const time =
      messageDate.toLocaleTimeString(
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
    } else if (
      isSameDay(messageDate, yesterday)
    ) {
      datePart = "Yesterday";
    } else {
      datePart =
        messageDate.toLocaleDateString(
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

  const mediaSource = message.mediaUrl?.startsWith("blob:") || message.mediaUrl?.startsWith("http")
    ? message.mediaUrl
    : message.mediaUrl
      ? `${API}${message.mediaUrl}`
      : undefined;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems={
        isOwn ? "flex-end" : "flex-start"
      }
      sx={{
        mb: isLastInGroup ? 1.5 : 0.3,
      }}
    >
      <Box
        sx={{
          maxWidth: "100%",
          px: 2,
          py: 1.2,

          bgcolor: isOwn
            ? chatColors.primary
            : chatColors.surface,

          color: isOwn
            ? chatColors.onPrimary
            : chatColors.ink,

          border: isOwn
            ? "none"
            : `1px solid ${chatColors.line}`,

          boxShadow:
            "0 2px 8px rgba(0,0,0,.06)",

          borderRadius: "10px",

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
        {isImage && mediaSource && (
          <Box
            component="img"
            src={mediaSource}
            alt={
              message.mediaName || "image"
            }
            sx={{
              width: "100%",
              maxWidth: 320,
              borderRadius: 2,
              mb: message.content ? 1 : 0,
            }}
          />
        )}

        {isVideo && mediaSource && (
          <Box
            component="video"
            controls
            src={mediaSource}
            sx={{
              width: "100%",
              maxWidth: 320,
              borderRadius: 2,
              mb: message.content ? 1 : 0,
            }}
          />
        )}

        {message.content && (
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
        )}
      </Box>

      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        mt={0.5}
        px={0.5}
      >
        {showTimestamp && (
          <Typography
            sx={{
              fontFamily: chatFonts.mono,
              fontSize: 11,
              color: chatColors.inkSoft,
            }}
          >
            {getDateTimeLabel(
              message.createdAt
            )}
          </Typography>
        )}

        {isOwn &&
          (message.isPending ? (
            <AccessTimeIcon
              sx={{
                fontSize: 13,
                color: chatColors.inkSoft,
                opacity: 0.7,
              }}
            />
          ) : message.isRead ? (
            <DoneAllIcon
              sx={{
                fontSize: 15,
                color: "#42A5F5",
              }}
            />
          ) : message.isDelivered ? (
            <DoneAllIcon
              sx={{
                fontSize: 15,
                color: chatColors.inkSoft,
              }}
            />
          ) : (
            <DoneIcon
              sx={{
                fontSize: 15,
                color: chatColors.inkSoft,
                opacity: 0.8,
              }}
            />
          ))}
      </Box>
    </Box>
  );
}
