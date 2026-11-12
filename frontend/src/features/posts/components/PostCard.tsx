import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChatIcon from "@mui/icons-material/Chat";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";

import { type Post } from "../types";

interface Props {
  post: Post;
  onClick?: () => void;
}

const PostCard = ({ post, onClick }: Props) => {
  const getUrgencyColor = () => {
    switch (post.urgency.toLowerCase()) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      default:
        return "success";
    }
  };

  const getModeIcon = () => {
    switch (post.preferredMode.toLowerCase()) {
      case "chat":
        return <ChatIcon />;
      case "call":
        return <CallIcon />;
      case "video":
      case "video call":
        return <VideocamIcon />;
      default:
        return <ChatIcon />;
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        transition: "border-color 160ms ease, background-color 160ms ease",
        "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ textAlign: "left", "&:hover .MuiCardActionArea-focusHighlight": { opacity: 0.03 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
            <Avatar
              src={`${import.meta.env.VITE_BACKEND_URL}${post.avatar}`}
              sx={{ bgcolor: "primary.main" }}
            >
              {post.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box>
              <Typography fontWeight={600} noWrap>{post.name}</Typography>

              <Typography variant="body2" color="text.secondary">Help request</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeIcon fontSize="small" color="disabled" />

            <Typography variant="body2" color="text.secondary" noWrap>{new Date(post.createdAt).toLocaleDateString()}</Typography>
          </Stack>
        </Stack>

        {/* Title */}
        <Typography variant="h5" fontWeight={600} mb={1.5}>
          {post.title}
        </Typography>
        {post.image && (
          <Box
            component="img"
            src={`${import.meta.env.VITE_BACKEND_URL}${post.image}`}
            alt={post.title}
            sx={{
              width: "100%",
              maxHeight: 350,
              objectFit: "cover",
              borderRadius: "10px",
              mb: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        )}

        {/* Tags */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          <Chip
            icon={<WarningAmberIcon />}
            label={`Urgency: ${post.urgency}`}
            color={getUrgencyColor()}
            size="small"
          />

          <Chip
            icon={getModeIcon()}
            label={post.preferredMode}
            variant="outlined"
            color="primary"
            size="small"
          />
        </Stack>

        {/* Description */}
        <Typography
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.65,
          }}
        >
          {post.description.split(" ").slice(0, 28).join(" ")}
          {post.description.split(" ").length > 28 && "…"}
        </Typography>

        {/* Footer */}
        <Stack direction="row" justifyContent="flex-end">
          <Typography color="primary.main" variant="body2" fontWeight={600} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            View request <ArrowForwardIcon sx={{ fontSize: 18 }} />
          </Typography>
        </Stack>
      </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PostCard;
