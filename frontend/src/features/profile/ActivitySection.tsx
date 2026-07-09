import {
  Avatar,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";

import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

const activities = [
  {
    title: "Solved a React routing issue",
    time: "2 hours ago",
    icon: (
      <VolunteerActivismRoundedIcon
        sx={{ color: "#2563EB" }}
      />
    ),
  },
  {
    title: "Joined AI Developers Community",
    time: "Yesterday",
    icon: (
      <GroupsRoundedIcon
        sx={{ color: "#10B981" }}
      />
    ),
  },
  {
    title: "Started a new conversation",
    time: "2 days ago",
    icon: (
      <ChatRoundedIcon
        sx={{ color: "#F59E0B" }}
      />
    ),
  },
  {
    title: "Received Top Helper Badge",
    time: "Last week",
    icon: (
      <EmojiEventsRoundedIcon
        sx={{ color: "#EF4444" }}
      />
    ),
  },
];

const ActivitySection = () => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 4,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          Recent Activity
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <List>
          {activities.map((activity, index) => (
            <ListItem
              key={index}
              sx={{
                borderRadius: 3,
                transition: ".2s",

                "&:hover": {
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: "#EEF4FF",
                  }}
                >
                  {activity.icon}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={activity.title}
                secondary={activity.time}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ActivitySection;