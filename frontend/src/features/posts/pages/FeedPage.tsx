import { Container, Typography } from "@mui/material";
import PostCard from "../components/PostCard";
import { useEffect, useState } from "react";
import axios from 'axios';
import type { Post, HelpRequestResponse } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
/* 🔹 Local type */
// interface Post {
//   id: string;
//   title: string;
//   content: string;
//   author: string;
//   createdAt: string;
// }

const FeedPage = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<Post[]>([]);
  useEffect(() => {
    const func = async () => {
      try {
        const API = import.meta.env.VITE_BACKEND_URL;
        const res = await api.get(`${API}/api/help-requests?status=open`);
        console.log(res)
        const data = res.data.data.map(
          ({
            category_id,
            community_id,
            created_at,
            created_by,
            name,
            preferred_mode,
            ...rest
          }: HelpRequestResponse) => ({
            ...rest,
            categoryId: category_id,
            communityId: community_id,
            createdAt: created_at,
            createdBy: created_by,
            name: name,
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
        global help request Feed!
      </Typography>
      {data.map((h => (
        <PostCard key={h.id} post={h} onClick={() => navigate(`/help-request/${h.id}`)} />
      )))}

    </Container>
  );
};

export default FeedPage;