import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import type { Community } from "../../types/user";

interface CommunitySectionProps {
  communities: Community[];
}

const CommunitySection = ({ communities }: CommunitySectionProps) => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 4,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Communities
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,1fr)",
              md: "repeat(3,1fr)",
              lg: "repeat(5,1fr)",
            },
            gap: 3,
          }}
        >
          {communities.length > 0 ? (
            communities.map((community) => (
              <Card
                key={community.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  textAlign: "center",
                  transition: ".25s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent
                  sx={{
                    py: 3,
                    px: 2,
                  }}
                >
                  <Stack spacing={1.5} alignItems="center">
                    <Avatar
                      src={community.avatar ?? undefined}
                      sx={{
                        width: 60,
                        height: 60,
                      }}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </Avatar>

                    <Typography
                      fontWeight={700}
                      fontSize={18}
                    >
                      {community.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {community.total_members} Members
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        minHeight: 40,
                      }}
                    >
                      Community on Socius
                    </Typography>

                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        mt: 1,
                        borderRadius: 3,
                        textTransform: "none",
                      }}
                    >
                      View
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography color="text.secondary">
              You haven't joined any communities yet.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CommunitySection;