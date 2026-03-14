import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
        >
          Socious
        </Typography>

        <Box>
<Button color="inherit" component={RouterLink} to="/feed">
  Feed
</Button>
<Button color="inherit" component={RouterLink} to="/create-community">
  Create Community
</Button>
<Button color="inherit" component={RouterLink} to="/login">
  Login
</Button>
<Button variant="outlined" color="inherit" component={RouterLink} to="/register">
  Sign Up
</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;