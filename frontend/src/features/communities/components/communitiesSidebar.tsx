import {
  Avatar,
  Box,
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
        width: { xs: "100%", md: 320 },
        minWidth: { xs: 0, md: 320 },
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
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">
          Communities
        </Typography>

        <IconButton color="primary" onClick={onToggleCreateCommunity}>
          {showCreate ? <CloseIcon /> : <AddIcon />}
        </IconButton>
      </Box>

      {/* Community List */}
      {loading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <List
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {communities.map((community) => (
            <ListItemButton
              key={community.id}
              onClick={() => onSelectCommunity(community)}
              selected={selectedCommunityId === community.id}
              sx={{ mx: 1, my: 0.5, borderRadius: "10px", py: 1.25, "&.Mui-selected": { bgcolor: "action.selected", "&:hover": { bgcolor: "action.selected" } } }}
            >
              <ListItemAvatar>
                <Avatar
                  src={`${import.meta.env.VITE_BACKEND_URL}${community.avatar}`}
                >
                  {!community.avatar && community.name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={community.name}
                secondary={community.description}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
};

export default CommunitySidebar;
