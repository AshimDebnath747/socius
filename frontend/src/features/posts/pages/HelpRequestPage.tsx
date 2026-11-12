import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  Stack,
  Grid,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "../../../lib/axios";
import type { Post } from "../types";
import { useNavigate } from "react-router-dom";
import PostInfoChips from "../components/helpRequestPageComponents/PostInfoChip";
import PostHeader from "../components/helpRequestPageComponents/PostHeader";
import PostDescription from "../components/helpRequestPageComponents/PostDescription";
import HelpRequestAction from "../components/helpRequestPageComponents/HelpRequestAction";
const PostPage = () => {
  const { id } = useParams();

  const [request, setRequest] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"call" | "text">("call");

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await api.get(`/api/help-requests/${id}`);
        if (!res.data?.success || !res.data?.data) {
          setRequest(null);
          return;
        }
        const data = res.data.data;
        const post: Post = {
          id: data.id,
          title: data.title,
          description: data.description,
          categoryId: data.category_id,
          communityId: data.community_id,
          preferredMode: data.preferred_mode,
          status: data.req_status,
          urgency: data.urgency,
          createdAt: data.created_at,
          createdBy: data.created_by,
          name: data.name,
          avatar: data.avatar,
          image: data.image,
        };
        setRequest(post);
      } catch (err) {
        console.error("Could not load help request:", err);
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);
  const navigate = useNavigate();

  const handleAcceptRequest = async () => {
    try {
      const res = await api.post("/api/sessions/request", {
        helpRequestId: Number(id),
        mode,
      });

      console.log(res.data);
      navigate("/chat");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Typography align="center" mt={5}>
        Help request not found.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        "@keyframes fadeIn": {
          from: {
            opacity: 0,
            transform: "translateY(20px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        animation: "fadeIn 0.7s ease",
      }}
    >
      <Box maxWidth="1200px" mx="auto" p={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
          }}
        >
          Back
        </Button>
        <PostHeader
          title={request.title}
          name={request.name}
          createdAt={request.createdAt}
          avatar={request.avatar}
        />
        <Grid container spacing={3} alignItems="stretch">
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {request.image && (
                <Box
                  component="img"
                  src={
                    request.image.startsWith("http")
                      ? request.image
                      : `${import.meta.env.VITE_BACKEND_URL || ""}${request.image.startsWith("/") ? "" : "/"}${request.image}`
                  }
                  alt={request.title}
                  sx={{
                    width: "100%",
                    maxHeight: 450,
                    objectFit: "cover",
                    borderRadius: "10px",
                    boxShadow: 3,
                  }}
                />
              )}

              <PostDescription description={request.description} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3} sx={{ height: "100%" }}>
              <PostInfoChips
                urgency={request.urgency}
                preferredMode={request.preferredMode}
                status={request.status}
                category={request.categoryId}
              />

              <HelpRequestAction
                mode={mode}
                setMode={setMode}
                onAccept={handleAcceptRequest}
                loading={loading}
              />
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PostPage;
