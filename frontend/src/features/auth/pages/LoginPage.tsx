import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Divider,
  InputAdornment,
  IconButton,
  Paper,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import googlelogo from "../../../assets/googlelogo.svg"
import axios from "axios";
interface LoginFormValues {
  email: string;
  password: string;
}
// interface User {
//   id: string;
//   name: string;
//   email: string;
// }
// interface LoginResponse {
//   data :
// }
const LoginPage = () => {
  const { register, handleSubmit } = useForm<LoginFormValues>();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_BACKEND_URL;

  // ✅ LOGIN FUNCTION (FIXED)
  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage("");
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/api/auth/login`,
        {
          // 🔥 important for cookies
          email: data.email,
          password: data.password,
        },
        { withCredentials: true },
      );
      console.log(res.data.data);
      localStorage.setItem("user", JSON.stringify(res.data.data));
      window.location.assign("/"); // force reload so auth check works
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn’t sign you in. Check your email and password, then try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Google Login
  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/auth/google-auth`;
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          minHeight: "calc(100dvh - 136px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 3, sm: 6 },
        }}
      >
        <Paper
          sx={{
            width: "100%",
            maxWidth: 480,
            p: { xs: 2.5, sm: 4 },
            borderRadius: { xs: "10px", sm: "10px" },
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 18px 54px rgba(60,64,67,.10)",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Welcome back
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mb: 3,
            }}
          >
            Sign in to continue to your conversations and communities.
          </Typography>

          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

          {/* Register Button */}
          <Button
            variant="text"
            sx={{ mb: 2, px: 0 }}
            onClick={() => navigate("/register")}
          >
            Register
          </Button>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <TextField
              label="Email"
              fullWidth
              margin="dense"
              {...register("email", { required: true })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password */}
            <TextField
              label="Password"
              fullWidth
              margin="dense"
              type={showPassword ? "text" : "password"}
              {...register("password", { required: true })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                mt: 2.5,
                py: 1.4,
              }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>

            <Divider sx={{ my: 3 }}>or</Divider>

            {/* Google Login */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              sx={{
                py: 1.3,
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              <img
                src={googlelogo}
                alt="Google"
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 10,
                }}
              />
              Continue with Google
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
