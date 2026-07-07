import {
  Alert,
  Box,
  Snackbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import CommunitySidebar from "../communities/components/communitiesSidebar";
import CreateCommunityPage from "../communities/components/CreateCommunityPage";

import { getAllCommunities } from "../../services/community.service";
import type { Community } from "../../types/community";

const CommunityPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] =
    useState<Community | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchCommunities = async () => {
    try {
      const data = await getAllCommunities();

      setCommunities(data);

      // Select first community if none selected
      if (data.length > 0 && !selectedCommunity) {
        setSelectedCommunity(data[0]);
      }

      // If selected community no longer exists,
      // select the first available community.
      if (
        selectedCommunity &&
        !data.find((c: { id: number; }) => c.id === selectedCommunity.id)
      ) {
        setSelectedCommunity(data[0] ?? null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCommunityCreated = async () => {
    await fetchCommunities();

    setShowCreate(false);

    setSnackbarOpen(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
      }}
    >
      <CommunitySidebar
        communities={communities}
        showCreate={showCreate}
        onSelectCommunity={setSelectedCommunity}
        onToggleCreateCommunity={() =>
          setShowCreate((prev) => !prev)
        }
      />

      <Box
        sx={{
          flex: 1,
          p: 3,
          overflowY: "auto",
        }}
      >
        {showCreate ? (
          <CreateCommunityPage
            onSuccess={handleCommunityCreated}
          />
        ) : selectedCommunity ? (
          <>
            <Typography
              variant="h3"
              fontWeight="bold"
            >
              {selectedCommunity.name}
            </Typography>

            <Typography
              sx={{ mt: 3 }}
            >
              {selectedCommunity.description}
            </Typography>

            <Typography
              sx={{ mt: 3 }}
            >
              <strong>Rules:</strong>{" "}
              {selectedCommunity.rules}
            </Typography>

            <Typography
              sx={{ mt: 3 }}
            >
              <strong>Privacy:</strong>{" "}
              {selectedCommunity.is_private
                ? "Private"
                : "Public"}
            </Typography>
          </>
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h5"
              color="text.secondary"
            >
              Select a community
            </Typography>
          </Box>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setSnackbarOpen(false)}
          >
            Community created successfully!
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default CommunityPage;