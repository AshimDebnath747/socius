import { Container, Typography } from "@mui/material";
import PostCard from "../components/PostCard";

/* 🔹 Local type */
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

const mockPosts: Post[] = [
  {
    id: "1",
    title: "How to handle async bugs in React?",
    content: "I’m facing race conditions while fetching data...",
    author: "Rohit",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Best way to structure large React apps?",
    content: "Feature-based or domain-based structure?",
    author: "Admin",
    createdAt: "1 day ago",
  },
];

const FeedPage = () => {
  return (
    <Container sx={{ py: 4, minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Community Feed
      </Typography>

      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </Container>
  );
};

export default FeedPage;