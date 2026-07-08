import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

import axios from 'axios';
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
  const navigate = useNavigate();

  const API = import.meta.env.VITE_BACKEND_URL

  // ✅ LOGIN FUNCTION (FIXED)
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, { // 🔥 important for cookies
        email: data.email,
        password: data.password,
      }, { withCredentials: true });
      localStorage.setItem("user", JSON.stringify(res.data.data));
      window.location.assign("/") // force reload so auth check works
    } catch (error) {
      const message = "wrong credetials bro!";
      alert(message);
    }
  };

  // Google Login
  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/auth/google-auth`;
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            p: 4,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
            background: "#fff",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, textAlign: "center", mb: 1 }}
          >
            Login
          </Typography>

          <Typography
            sx={{
              textAlign: "center",
              color: "text.secondary",
              fontSize: 14,
              mb: 3,
            }}
          >
            Enter your credentials to continue
          </Typography>

          {/* Register Button */}
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => navigate("/register")}
          >
            Register
          </Button>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <TextField
              label="Email"
              fullWidth
              margin="normal"
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
              margin="normal"
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
              sx={{
                mt: 3,
                py: 1.4,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Login
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
              Continue with Google
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;