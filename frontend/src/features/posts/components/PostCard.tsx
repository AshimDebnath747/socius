import { Card, CardContent, Typography, Box, Chip } from "@mui/material";

interface Post {
  title: string;
  author: string;
  createdAt: string; // or Date if you prefer
  content: string;
}

interface Props {
  post: Post;
}

const PostCard = ({ post }: Props) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          {post.title}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 1 }}>
          Posted by {post.author} • {post.createdAt}
        </Typography>

        <Typography sx={{ mb: 2 }}>
          {post.content}
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