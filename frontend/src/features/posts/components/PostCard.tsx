import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { type Post } from "../types";

interface Props {
  post: Post;
  onClick?: () => void
}

const PostCard = ({ post, onClick }: Props) => {
  return (
    <Card sx={{ mb: 2 }} onClick={onClick}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          {post.title}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 1 }}>
          Posted by {post.name} • {post.createdAt}
        </Typography>

        <Typography sx={{ mb: 2 }}>
          {post.description}
        </Typography>

        <Box>
          <Chip label="Comment" size="small" sx={{ mr: 1 }} />
          <Chip label="Tag User" size="small" />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PostCard;