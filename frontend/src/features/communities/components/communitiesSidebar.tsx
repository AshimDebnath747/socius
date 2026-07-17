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
  onSelectCommunity: (community: Community) => void;
  onToggleCreateCommunity: () => void;
};

const CommunitySidebar = ({
  communities,
  loading,
  showCreate,
  onSelectCommunity,
  onToggleCreateCommunity,
}: CommunitySidebarProps) => {
  return (
    <Box
      sx={{
        width: 320,
        minWidth: 320,
        height: "100%",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
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
