import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

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

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const res = await axios.post(`${API}/api/auth/signup`, { // 🔥 important for cookies
        name: data.name,
        email: data.email,
        password: data.password
      }, { withCredentials: true });
      localStorage.setItem("user", JSON.stringify(res.data.data));
      navigate("/login") // force reload so auth check works
    } catch (error) {
      console.log(error)
      const message = "wrong credetials bro!";
      alert(message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh' }}>
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Create Account
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            {...register("name", { required: true })}
          />

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register("email", { required: true })}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("password", { required: true })}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Register
          </Button>
        </form>

        <Button
          variant="text"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default RegisterPage;