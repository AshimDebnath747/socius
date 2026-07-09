import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

const stats = [
  {
    title: "Helped",
    value: 24,
    icon: <VolunteerActivismRoundedIcon fontSize="large" />,
    color: "#2563EB",
  },
  {
    title: "Requests",
    value: 12,
    icon: <DescriptionRoundedIcon fontSize="large" />,
    color: "#10B981",
  },
  {
    title: "Communities",
    value: 8,
    icon: <GroupsRoundedIcon fontSize="large" />,
    color: "#F59E0B",
  },
  {
    title: "Rating",
    value: "4.9",
    icon: <StarRoundedIcon fontSize="large" />,
    color: "#EF4444",
  },
];

const StatsSection = () => {
  return (
    <Grid container spacing={3}>
      {stats.map((item) => (
        <Grid size={{xs:12, md:6}} key={item.title}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 4,
              transition: ".25s",

              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 8,
              },
            }}
          >
            <CardContent>
              <Stack
                spacing={2}
                alignItems="center"
              >
                <Stack
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    bgcolor: item.color + "20",
                    color: item.color,
                  }}
                  justifyContent="center"
                  alignItems="center"
                >
                  {item.icon}
                </Stack>

                <Typography
                  variant="h4"
                  fontWeight={700}
                >
                  {item.value}
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {item.title}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsSection;