import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Slide,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CallEndIcon from "@mui/icons-material/CallEnd";
import VideocamIcon from "@mui/icons-material/Videocam";

interface IncomingCallDialogProps {
  open: boolean;
  callerName: string;
  callerAvatar: string | null;
  callMode: "voice" | "video";
  onAnswer: () => void;
  onReject: () => void;
}

const API = import.meta.env.VITE_BACKEND_URL;

export default function IncomingCallDialog({
  open,
  callerName,
  callerAvatar,
  callMode,
  onAnswer,
  onReject,
}: IncomingCallDialogProps) {
  const avatarUrl = callerAvatar
    ? callerAvatar.startsWith("http")
      ? callerAvatar
      : `${API}${callerAvatar}`
    : undefined;

  const isVideo = callMode === "video";

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit timeout={300}>
      <Box
        sx={{
          position: "fixed",
          top: { xs: 12, sm: 20 },
          right: { xs: 12, sm: 20 },
          zIndex: 2500,
          width: { xs: "calc(100vw - 24px)", sm: 360 },
          maxWidth: 380,
          pointerEvents: "auto",
        }}
      >
        <Paper
          elevation={16}
          sx={{
            bgcolor: "rgba(20, 23, 28, 0.95)",
            backdropFilter: "blur(14px)",
            color: "#FFFFFF",
            borderRadius: "20px",
            p: 2.5,
            border: "1px solid rgba(255, 255, 255, 0.16)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75)",
          }}
        >
          {/* Top section: Avatar + Caller Details */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  bgcolor: isVideo ? "rgba(99, 102, 241, 0.3)" : "rgba(34, 197, 94, 0.3)",
                  animation: "incoming-ring-pulse 1.8s ease-out infinite",
                  "@keyframes incoming-ring-pulse": {
                    "0%": { transform: "scale(0.9)", opacity: 0.9 },
                    "70%": { transform: "scale(1.3)", opacity: 0 },
                    "100%": { transform: "scale(1.35)", opacity: 0 },
                  },
                }}
              />
              <Avatar
                src={avatarUrl}
                sx={{
                  width: 56,
                  height: 56,
                  fontSize: 24,
                  fontWeight: 700,
                  bgcolor: isVideo ? "#4f46e5" : "#16a34a",
                  color: "#FFFFFF",
                  border: "2px solid #FFFFFF",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {callerName.charAt(0).toUpperCase()}
              </Avatar>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                noWrap
                sx={{ letterSpacing: "-0.01em", color: "#FFFFFF", fontSize: 16 }}
              >
                {callerName}
              </Typography>
              <Chip
                icon={
                  isVideo ? (
                    <VideocamIcon sx={{ fontSize: "14px !important", color: "inherit" }} />
                  ) : (
                    <CallIcon sx={{ fontSize: "13px !important", color: "inherit" }} />
                  )
                }
                label={isVideo ? "Incoming Video Call" : "Incoming Voice Call"}
                color={isVideo ? "primary" : "success"}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 600,
                  mt: 0.5,
                  borderRadius: "8px",
                }}
              />
            </Box>
          </Stack>

          {/* Action Buttons: Pure Icon Buttons (Decline in Red, Accept in Green/Blue) */}
          <Stack direction="row" justifyContent="center" spacing={4} sx={{ pt: 1 }}>
            {/* Decline Button (Red Icon Button) */}
            <Tooltip title="Decline">
              <IconButton
                onClick={onReject}
                aria-label="Decline call"
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: "#ef4444",
                  color: "#FFFFFF",
                  boxShadow: "0 6px 18px rgba(239, 68, 68, 0.45)",
                  transition: "transform 150ms ease, background-color 150ms ease",
                  "&:hover": {
                    bgcolor: "#dc2626",
                    transform: "scale(1.08)",
                  },
                }}
              >
                <CallEndIcon sx={{ fontSize: 26 }} />
              </IconButton>
            </Tooltip>

            {/* Accept Button (Icon matching Voice vs Video) */}
            <Tooltip title={isVideo ? "Answer Video Call" : "Answer Voice Call"}>
              <IconButton
                onClick={onAnswer}
                aria-label={isVideo ? "Answer Video Call" : "Answer Voice Call"}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: isVideo ? "#4f46e5" : "#16a34a",
                  color: "#FFFFFF",
                  boxShadow: isVideo
                    ? "0 6px 18px rgba(79, 70, 229, 0.45)"
                    : "0 6px 18px rgba(22, 163, 74, 0.45)",
                  transition: "transform 150ms ease, background-color 150ms ease",
                  "&:hover": {
                    bgcolor: isVideo ? "#4338ca" : "#15803d",
                    transform: "scale(1.08)",
                  },
                }}
              >
                {isVideo ? (
                  <VideocamIcon sx={{ fontSize: 28 }} />
                ) : (
                  <CallIcon sx={{ fontSize: 26 }} />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      </Box>
    </Slide>
  );
}
