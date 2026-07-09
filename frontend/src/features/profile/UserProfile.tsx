import { Box, Container, Grid, Stack } from "@mui/material";

import ProfileHeader from "./ProfileHeader";
import StatsSection from "./StatsSection";
import ActivitySection from "./ActivitySection";
import CommunitySection from "./CommunitySection";

const UserProfile = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <ProfileHeader />
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <StatsSection />
            <ActivitySection />
          </Stack>
        </Grid>
            
      </Grid>
      <Box mt={3}>
    <CommunitySection />
</Box>
    </Container>
  );
};

export default UserProfile;