import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useState } from "react";
import { initializeUserCryptoKeys } from "../../../lib/crypto";

/* 🔹 Local type */
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}
const API = import.meta.env.VITE_BACKEND_URL
const RegisterPage = () => {
  const { register, handleSubmit } = useForm<RegisterFormValues>();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMessage("");
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/auth/signup`, { // 🔥 important for cookies
        name: data.name,
        email: data.email,
        password: data.password
      }, { withCredentials: true });
      localStorage.setItem("user", JSON.stringify(res.data.data));
      if (res.data?.data?.id) {
        try {
          await initializeUserCryptoKeys(res.data.data.id, data.password);
        } catch (keyErr) {
          console.error("Could not initialize E2EE keys on signup:", keyErr);
        }
      }
      navigate("/login") // force reload so auth check works
    } catch (error) {
      console.log(error)
      setErrorMessage("We couldn’t create your account. Check the details or try signing in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box sx={{ minHeight: "calc(100dvh - 136px)", display: "flex", alignItems: "center", justifyContent: "center", py: { xs: 3, sm: 6 } }}>
      <Paper sx={{ width: "100%", maxWidth: 500, p: { xs: 2.5, sm: 4 }, borderRadius: { xs: "10px", sm: "10px" }, border: "1px solid", borderColor: "divider", boxShadow: "0 18px 54px rgba(60,64,67,.10)" }}>
        <Typography variant="h4" fontWeight={600} mb={1}>
          Create Account
        </Typography>
        <Typography color="text.secondary" mb={3}>Create your Socious account to connect with people who can help.</Typography>

        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <Stack component="form" spacing={1.5} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Name"
            fullWidth
            {...register("name", { required: true })}
          />

          <TextField
            label="Email"
            fullWidth
            {...register("email", { required: true })}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            {...register("password", { required: true })}
          />

          <Button type="submit" variant="contained" fullWidth disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </Stack>

        <Button
          variant="text"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
