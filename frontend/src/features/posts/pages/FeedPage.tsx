import { Alert, Box, Card, CardContent, Container, Divider, Snackbar, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { Post, HelpRequestResponse } from "../types";
import Loader from "../../../components/loader";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
import FeedSearchBar from "../components/FeedSearchBar";
import CreateHelpFab from "../components/CreateHelpFab";
import FeedList from "../components/FeedList";
import { useLocation } from "react-router-dom";
/* 🔹 Local type */
// interface Post {
//   id: string;
//   title: string;
//   content: string;
//   author: string;
//   createdAt: string;
// }
const user: string | null = localStorage.getItem("user");
console.log("user :", user);
let CURRENT_USER_ID: string = "";

const FeedPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState(false);
  const location = useLocation();

  const [openSnackbar, setOpenSnackbar] = useState(
    Boolean(location.state?.success),
  );

  useEffect(() => {
    const func = async () => {
      try {
        const res = await api.get("/api/help-requests?status=open");
        if (user) CURRENT_USER_ID = String(JSON.parse(user).id);
        const data = res.data.data
          .filter(
            ({ created_by }: HelpRequestResponse) =>
              String(created_by) !== CURRENT_USER_ID,
          )
          .map(
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
              name,
              preferredMode: preferred_mode,
            }),
          );

        setData(data);
      } catch (err) {
        console.error("Could not load help requests:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    func();
  }, []);
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0, 1fr) 280px" }, gap: { xs: 2.5, md: 4 }, alignItems: "start" }}>
        <Box sx={{ minWidth: 0, maxWidth: 760, width: "100%", mx: { xs: 0, md: "auto" } }}>
          <Stack spacing={0.75} sx={{ mb: 3 }}>
            <Typography variant="h3">Help requests</Typography>
            <Typography color="text.secondary">Share what you know. Find someone who can help.</Typography>
          </Stack>
          <FeedSearchBar value={search} onChange={setSearch} />
          {loadError && <Alert severity="error" sx={{ mb: 2 }}>Help requests could not be loaded. Check your connection and refresh the page.</Alert>}
          {loading ? <Loader /> : <FeedList posts={data} search={search} />}
        </Box>

        <Card sx={{ display: { xs: "none", md: "block" }, width: "100%", position: "sticky", top: 92 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>A helpful community starts with you</Typography>
            <Typography variant="body2" color="text.secondary">A few details make it easier for another student to respond.</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.75}>
              <Box><Typography variant="subtitle2">Be specific</Typography><Typography variant="body2" color="text.secondary">Describe the topic and where you got stuck.</Typography></Box>
              <Box><Typography variant="subtitle2">Choose a subject</Typography><Typography variant="body2" color="text.secondary">Relevant topics help the right people find your request.</Typography></Box>
              <Box><Typography variant="subtitle2">Follow up</Typography><Typography variant="body2" color="text.secondary">Continue in chat or set up a session when it helps.</Typography></Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <CreateHelpFab onClick={() => navigate("/helprequest")} />
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setOpenSnackbar(false)}
        >
          {location.state?.success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FeedPage;
