import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonth";

const skills = [
  "React",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Docker",
  "Python",
];

export default function ProfileHeader() {
  return (
    <Paper
      elevation={3}
      sx={{
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      {/* Cover */}
      <Box
        sx={{
          height: 180,
          background:
            "linear-gradient(135deg,#2563EB 0%,#4F46E5 45%,#7C3AED 100%)",
        }}
      />

      <Box sx={{ px: 4, pb: 4 }}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "center",
            md: "flex-start",
          }}
        >
          <Stack
            spacing={2}
            alignItems={{
              xs: "center",
              md: "flex-start",
            }}
            sx={{
              mt: -8,
            }}
          >
            <Avatar
              sx={{
                width: 130,
                height: 130,
                border: "5px solid white",
                boxShadow: 4,
              }}
            />

            <Box
              textAlign={{
                xs: "center",
                md: "left",
              }}
            >
              <Typography fontWeight={700} variant="h4">
                Manna Sharma
              </Typography>

              <Typography color="text.secondary">@manna</Typography>

              <Typography mt={1} fontWeight={500}>
                Full Stack Developer
              </Typography>

              <Typography color="text.secondary" mt={1}>
                Passionate about building community driven platforms with React,
                Node.js and AI.
              </Typography>
            </Box>
          </Stack>

          <IconButton
            color="primary"
            sx={{
              bgcolor: "white",
              color: "gray",
              width: 40,
              height: 40,

              "&:hover": {
                bgcolor: "light-gray",
              },
            }}
          >
            <EditIcon />
          </IconButton>
        </Stack>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={3}
          mt={4}
        >
          <Stack direction="row" spacing={1}>
            <LocationOnRoundedIcon fontSize="small" />
            <Typography color="text.secondary">Tripura</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <LanguageRoundedIcon fontSize="small" />
            <Typography color="text.secondary">Portfolio</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <CalendarMonthRoundedIcon fontSize="small" />
            <Typography color="text.secondary">Joined Jul 2026</Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={600}>
          About
        </Typography>

        <Typography mt={1} color="text.secondary">
          I'm a passionate full-stack developer who enjoys building scalable web
          applications, solving challenging problems and contributing to open
          communities.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={600} mb={2}>
          Skills
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {skills.map((skill) => (
            <Chip key={skill} label={skill} color="primary" />
          ))}
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Stack direction="row" justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              120
            </Typography>

            <Typography color="text.secondary">Posts</Typography>
          </Box>

          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              15
            </Typography>

            <Typography color="text.secondary">Communities</Typography>
          </Box>

          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              450
            </Typography>

            <Typography color="text.secondary">Reputation</Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
