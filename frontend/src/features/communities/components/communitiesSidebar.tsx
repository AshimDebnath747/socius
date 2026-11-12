import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import type { Community } from "../../../types/community";

type CommunitySidebarProps = {
  communities: Community[];
  loading: boolean;
  showCreate: boolean;
  selectedCommunityId?: number;
  onSelectCommunity: (community: Community) => void;
  onToggleCreateCommunity: () => void;
};

const CommunitySidebar = ({
  communities,
  loading,
  showCreate,
  selectedCommunityId,
  onSelectCommunity,
  onToggleCreateCommunity,
}: CommunitySidebarProps) => {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 330 },
        minWidth: { xs: 0, md: 330 },
        height: "100%",
        borderRight: { xs: 0, md: "1px solid" },
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 69,
          boxSizing: "border-box",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
            Communities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Explore and connect
          </Typography>
        </Box>

        <IconButton
          color="primary"
          onClick={onToggleCreateCommunity}
          size="small"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            p: 0.75,
          }}
          title={showCreate ? "Close create form" : "Create community"}
        >
          {showCreate ? <CloseIcon fontSize="small" /> : <AddIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Community List */}
      {loading ? (
        <Box
          sx={{
            flex: 1,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress size={26} />
        </Box>
      ) : (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            py: 1,
          }}
        >
          {communities.map((community) => (
            <ListItemButton
              key={community.id}
              onClick={() => onSelectCommunity(community)}
              selected={selectedCommunityId === community.id}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: "10px",
                py: 1.25,
                "&.Mui-selected": { bgcolor: "action.selected", "&:hover": { bgcolor: "action.selected" } },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={
                    community.avatar
                      ? community.avatar.startsWith("http")
                        ? community.avatar
                        : `${import.meta.env.VITE_BACKEND_URL}${community.avatar}`
                      : undefined
                  }
                  sx={{ bgcolor: "action.selected", color: "primary.main", fontWeight: 600 }}
                >
                  {community.name ? community.name.charAt(0).toUpperCase() : "C"}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={community.name}
                secondary={community.description || "No description"}
                primaryTypographyProps={{ noWrap: true, fontWeight: 600, fontSize: 14 }}
                secondaryTypographyProps={{ noWrap: true, fontSize: 12.5 }}
              />
            </ListItemButton>
          ))}
          {!communities.length && (
            <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
                No communities yet.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={onToggleCreateCommunity}
                sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px" }}
              >
                Create a community
              </Button>
            </Box>
          )}
        </List>
      )}
    </Box>
  );
};

export default CommunitySidebar;
