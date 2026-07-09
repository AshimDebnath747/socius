import {
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,Box
} from "@mui/material";

import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

const AboutSection = () => {
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
          About Me
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography
          color="text.secondary"
          lineHeight={1.8}
          mb={4}
        >
          Passionate full-stack developer who enjoys solving
          real-world problems and helping students through
          technology. Interested in React, Node.js,
          Competitive Programming and Artificial Intelligence.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{xs:12, md:6}}>
            <Stack direction="row" spacing={2} alignItems="center">
              <EmailRoundedIcon color="primary" />
              <Box>
                <Typography fontWeight={600}>Email</Typography>
                <Typography color="text.secondary">
                  manna@gmail.com
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{xs:12, md:6}}>
            <Stack direction="row" spacing={2} alignItems="center">
              <SchoolRoundedIcon color="primary" />
              <Box>
                <Typography fontWeight={600}>Education</Typography>
                <Typography color="text.secondary">
                  B.Tech Computer Science
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{xs:12, md:6}}>
            <Stack direction="row" spacing={2} alignItems="center">
              <LocationOnRoundedIcon color="primary" />
              <Box>
                <Typography fontWeight={600}>Location</Typography>
                <Typography color="text.secondary">
                  Tripura, India
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{xs:12, md:6}}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarMonthRoundedIcon color="primary" />
              <Box>
                <Typography fontWeight={600}>Joined</Typography>
                <Typography color="text.secondary">
                  January 2026
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AboutSection;