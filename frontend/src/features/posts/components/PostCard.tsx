import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import CommentIcon from "@mui/icons-material/Comment";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
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
      onClick={onClick}
      sx={{
        mb: 3,
        borderRadius: 5,
        cursor: "pointer",
        transition: "all .25s ease",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 8,
          borderColor: "primary.main",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Avatar src={`${import.meta.env.VITE_BACKEND_URL}${post.avatar}`}
              sx={{ bgcolor: "primary.main" }}>
              {post.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box>
              <Typography fontWeight={700}>
                {post.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Help Request
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <AccessTimeIcon
              fontSize="small"
              color="disabled"
            />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {new Date(post.createdAt).toLocaleDateString()}
            </Typography>
          </Stack>
        </Stack>

        {/* Title */}
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
        >
          {post.title}
        </Typography>

        {/* Tags */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          mb={2}
        >
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
            mb: 3,
            lineHeight: 1.8,
          }}
        >
          {post.description.split(" ").slice(0, 10).join(" ")}
          {post.description.split(" ").length > 10 && "..."}
        </Typography>

        {/* Footer */}
        <Stack
          direction="row"
          spacing={1}
        >
          <Chip
            icon={<CommentIcon />}
            label="Comment"
            clickable
            variant="outlined"
          />

          <Chip
            icon={<AlternateEmailIcon />}
            label="Tag User"
            clickable
            variant="outlined"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PostCard;