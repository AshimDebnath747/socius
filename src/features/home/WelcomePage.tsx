import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import Grid from "@mui/material/Grid";

interface Feature {
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    title: "Post Your Problems",
    description:
      "Share your problems openly and let the community help you with solutions.",
  },
  {
    title: "Tag & Discuss",
    description:
      "Tag users, comment on posts, and have meaningful discussions.",
  },
  {
    title: "Private & Group Chat",
    description:
      "Chat in real-time with users through private or group conversations.",
  },
];

const WelcomePage = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
          color: "#fff",
        }}
      >
        <Container>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Welcome to Socious
          </Typography>

          <Typography variant="h6" sx={{ maxWidth: 600, mb: 4 }}>
            A community-driven platform where problems meet real solutions.
            Discuss, connect, and chat in real time.
          </Typography>

          <Button variant="contained" size="large" sx={{ mr: 2 }}>
            Get Started
          </Button>

          <Button variant="outlined" size="large" color="inherit">
            Explore Community
          </Button>
        </Container>
      </Box>

      {/* Features */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold" mb={6}>
          Why Socious?
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>

                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default WelcomePage;