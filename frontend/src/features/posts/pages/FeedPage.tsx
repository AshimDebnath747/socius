import { Container, Typography } from "@mui/material";
import PostCard from "../components/PostCard";
import { useEffect, useState } from "react";
import axios from 'axios';
/* 🔹 Local type */
// interface Post {
//   id: string;
//   title: string;
//   content: string;
//   author: string;
//   createdAt: string;
// }


interface HelpRequestResponse {
  id: number;
  title: string;
  description: string;
  category_id: number;
  urgency: "low" | "medium" | "high";
  preferred_mode: "text" | "call";
  community_id: number | null;
  created_by: number;
  created_at: string;
  status: string;
}
type FormData = {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  urgency: "low" | "medium" | "high";
  preferredMode: "text" | "call";
  communityId: number | null;
  createdBy: number;
  createdAt: string;
  status: string;
};
const FeedPage = () => {

  const [data, setData] = useState<FormData[]>([]);
  useEffect(() => {
    const func = async () => {
      try {
        const API = import.meta.env.VITE_BACKEND_URL;
        const res = await axios.get(`${API}/api/help-requests?status=open`,
          { withCredentials: true },
        );
        console.log(res)
        const data = res.data.data.map(
          ({
            category_id,
            community_id,
            created_at,
            created_by,
            preferred_mode,
            ...rest
          }: HelpRequestResponse) => ({
            ...rest,
            categoryId: category_id,
            communityId: community_id,
            createdAt: created_at,
            createdBy: created_by,
            preferredMode: preferred_mode,
          })
        );

        console.log(data)
        setData(data)
      } catch (err) {
        console.log(err)
      }
    };

    func();
  }, []);
  return (
    <Container sx={{ py: 4, minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Community Feed
      </Typography>
      {data.map((h => (
        <PostCard post={h} />
      )))}

    </Container>
  );
};

export default FeedPage;