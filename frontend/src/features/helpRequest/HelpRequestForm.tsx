import { useState } from "react";
import {
  Box,
  Alert,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../lib/axios";
import ImageUpload from "./components/ImageUpload";
import { useNavigate } from "react-router-dom";
type FormData = {
  title: string;
  description: string;
  categoryId: string;
  urgency: "low" | "medium" | "high";
  preferredMode: "text" | "call";
  communityId: string;
};

export default function CreateHelpRequestForm() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    categoryId: "1",
    urgency: "medium",
    preferredMode: "text",
    communityId: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const payload = new FormData();

    payload.append("title", formData.title);
    payload.append("description", formData.description);
    if (formData.categoryId) {
      payload.append("categoryId", formData.categoryId);
    }
    payload.append("urgency", formData.urgency);
    payload.append("preferredMode", formData.preferredMode);

    if (formData.communityId.trim()) {
      payload.append("communityId", formData.communityId.trim());
    }

    if (image) {
      payload.append("image", image);
    }
    try {
      await api.post("/api/help-requests", payload);

      navigate("/feed", {
        state: {
          success: "Help request created successfully!",
        },
      });
    } catch (err: any) {
      console.error("Could not create help request:", err);
      const serverMessage =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.join(", ")
          : null) ||
        "Your request could not be created. Please check your inputs and try again.";
      setErrorMessage(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 2.5, sm: 4 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "10px",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Create Help Request
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Add enough context for another student to understand where you need help.
        </Typography>

        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <Stack spacing={3}>
          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={5}
            required
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="categoryId"
              value={formData.categoryId}
              label="Category"
              onChange={handleChange}
            >
              <MenuItem value="1">CSE</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Urgency</InputLabel>
            <Select
              name="urgency"
              value={formData.urgency}
              label="Urgency"
              onChange={handleChange}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Preferred Mode</InputLabel>
            <Select
              name="preferredMode"
              value={formData.preferredMode}
              label="Preferred Mode"
              onChange={handleChange}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="call">Call</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Community ID (Optional)"
            name="communityId"
            type="number"
            value={formData.communityId}
            onChange={handleChange}
            fullWidth
          />
          <ImageUpload image={image} onImageChange={setImage} />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? "Creating request…" : "Create request"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
