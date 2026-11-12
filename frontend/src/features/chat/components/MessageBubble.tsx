import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissed";
import CallEndIcon from "@mui/icons-material/CallEnd";

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
  onStartCall?: (mode: "voice" | "video") => void;
}

const formatDuration = (seconds: number) => {
  const s = Math.round(Number(seconds) || 0);
  if (s <= 0) return "0s";
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

export default function CommunityChatBubble({
  message,
  isOwn,
  isLastInGroup,
  showTimestamp,
  onStartCall,
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

  if (message.messageType === "call") {
    let callData: {
      callMode: "voice" | "video";
      status: "missed" | "declined" | "completed";
      duration: number;
      callerId: string | number;
      receiverId: string | number;
    } | null = null;

    try {
      callData = typeof message.content === "string" ? JSON.parse(message.content) : message.content;
    } catch {
      callData = null;
    }

    const isVideoCall = callData?.callMode === "video";
    const status = callData?.status || "completed";
    const duration = callData?.duration || 0;
    const isCaller = isOwn;

    let title = "";
    let subtitle = "";
    let isMissed = false;

    if (status === "missed") {
      isMissed = true;
      if (isCaller) {
        title = isVideoCall ? "Outgoing Video Call" : "Outgoing Voice Call";
        subtitle = "No answer";
      } else {
        title = isVideoCall ? "Missed Video Call" : "Missed Voice Call";
        subtitle = "Tap to call back";
      }
    } else if (status === "declined") {
      if (isCaller) {
        title = isVideoCall ? "Video Call" : "Voice Call";
        subtitle = "Call declined";
      } else {
        title = isVideoCall ? "Declined Video Call" : "Declined Voice Call";
        subtitle = "Declined";
      }
    } else {
      title = isVideoCall ? "Video Call" : "Voice Call";
      subtitle = formatDuration(duration);
    }

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems={isOwn ? "flex-end" : "flex-start"}
        sx={{
          mb: isLastInGroup ? 1.5 : 0.5,
          width: "100%",
        }}
      >
        <Box
          sx={{
            minWidth: 220,
            maxWidth: { xs: 290, sm: 340 },
            p: 1.5,
            bgcolor: isOwn ? "#1b2c3f" : "#1e242d",
            color: "#FFFFFF",
            borderRadius: "14px",
            border: isMissed && !isCaller
              ? "1px solid rgba(239, 68, 68, 0.45)"
              : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
            ...(isLastInGroup
              ? isOwn
                ? { borderBottomRightRadius: 6 }
                : { borderBottomLeftRadius: 6 }
              : {}),
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Call State Icon with subtle colored circular background */}
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: isMissed && !isCaller
                  ? "rgba(239, 68, 68, 0.16)"
                  : status === "declined"
                  ? "rgba(239, 68, 68, 0.16)"
                  : "rgba(34, 197, 94, 0.16)",
                color: isMissed && !isCaller
                  ? "#ef4444"
                  : status === "declined"
                  ? "#ef4444"
                  : "#22c55e",
              }}
            >
              {isVideoCall ? (
                isMissed && !isCaller ? (
                  <VideocamOffIcon sx={{ fontSize: 22 }} />
                ) : (
                  <VideocamIcon sx={{ fontSize: 22 }} />
                )
              ) : isMissed && !isCaller ? (
                <PhoneMissedIcon sx={{ fontSize: 22 }} />
              ) : status === "declined" ? (
                <CallEndIcon sx={{ fontSize: 22 }} />
              ) : (
                <CallIcon sx={{ fontSize: 22 }} />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                noWrap
                sx={{
                  color: isMissed && !isCaller ? "#ef4444" : "#FFFFFF",
                  fontSize: 14,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </Typography>
              <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.25 }}>
                {isCaller ? (
                  <CallMadeIcon
                    sx={{
                      fontSize: 13,
                      color: isMissed ? "#ef4444" : "#94a3b8",
                    }}
                  />
                ) : (
                  <CallReceivedIcon
                    sx={{
                      fontSize: 13,
                      color: isMissed ? "#ef4444" : "#22c55e",
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: isMissed && !isCaller ? "#ef4444" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {subtitle}
                </Typography>
              </Stack>
            </Box>

            {/* Quick Call-back Action Button */}
            {onStartCall && (
              <Tooltip title={isVideoCall ? "Video Call back" : "Voice Call back"}>
                <IconButton
                  size="small"
                  onClick={() => onStartCall(isVideoCall ? "video" : "voice")}
                  sx={{
                    color: isMissed && !isCaller ? "#ef4444" : "#22c55e",
                    bgcolor: "rgba(255,255,255,0.06)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.15)",
                    },
                  }}
                >
                  {isVideoCall ? <VideocamIcon sx={{ fontSize: 18 }} /> : <CallIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "right",
              mt: 0.75,
              color: "rgba(255,255,255,0.45)",
              fontSize: 10,
              fontFamily: chatFonts.mono,
            }}
          >
            {getDateTimeLabel(message.createdAt)}
          </Typography>
        </Box>
      </Box>
    );
  }

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
                  ? chatColors.onPrimary
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
                  ? chatColors.onPrimary
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
