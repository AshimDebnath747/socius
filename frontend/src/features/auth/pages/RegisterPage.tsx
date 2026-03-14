import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

/* 🔹 Local type */
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

const RegisterPage = () => {
  const { register, handleSubmit } = useForm<RegisterFormValues>();

  const onSubmit = (data: RegisterFormValues) => {
    console.log("Register data:", data);
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
      </Box>
    </Container>
  );
};

export default RegisterPage;