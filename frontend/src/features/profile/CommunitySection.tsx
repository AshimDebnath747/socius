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

const communities = [
  {
    id: 1,
    name: "React Developers",
    members: "2.3k Members",
    description: "Frontend development discussions.",
    image: "https://i.pravatar.cc/150?img=10",
  },
  {
    id: 2,
    name: "Python Club",
    members: "1.8k Members",
    description: "Python programming and AI.",
    image: "https://i.pravatar.cc/150?img=20",
  },
  {
    id: 3,
    name: "Competitive Coding",
    members: "3.1k Members",
    description: "DSA & Coding contests.",
    image: "https://i.pravatar.cc/150?img=30",
  },
  {
    id: 4,
    name: "Machine Learning",
    members: "4.8k Members",
    description: "Deep Learning & ML.",
    image: "https://i.pravatar.cc/150?img=40",
  },
  {
    id: 5,
    name: "UI/UX Designers",
    members: "1.2k Members",
    description: "Design systems & Figma.",
    image: "https://i.pravatar.cc/150?img=50",
  },
  {
    id: 6,
    name: "Flutter",
    members: "2.0k Members",
    description: "Flutter & Dart.",
    image: "https://i.pravatar.cc/150?img=60",
  },
];

const CommunitySection = () => {
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
          {communities.map((community) => (
            <Card
              key={community.id}
              variant="outlined"
              sx={{
                borderRadius: 3,
                transition: ".25s",
                textAlign: "center",

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
                    src={community.image}
                    sx={{
                      width: 60,
                      height: 60,
                    }}
                  />

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
                    {community.members}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      minHeight: 40,
                    }}
                  >
                    {community.description}
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
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CommunitySection;