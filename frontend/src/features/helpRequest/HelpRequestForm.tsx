import { useState } from "react";
import {
  Box,
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
import axios from "axios";
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
    categoryId: "",
    urgency: "medium",
    preferredMode: "text",
    communityId: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();

    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("categoryId", formData.categoryId);
    payload.append("urgency", formData.urgency);
    payload.append("preferredMode", formData.preferredMode);

    if (formData.communityId) {
      payload.append("communityId", formData.communityId);
    }

    if (image) {
      payload.append("image", image);
    }
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const res = await axios.post(`${API}/api/help-requests`, payload, {
        withCredentials: true,
      });
      //   setFormData({
      //     title: "",
      //     description: "",
      //     categoryId: "",
      //     urgency: "medium",
      //     preferredMode: "text",
      //     communityId: "",
      //   });
      //   setImage(null);
      //   console.log(res);

      navigate("/feed", {
        state: {
          success: "Help request created successfully!",
        },
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          mt: 5,
          p: 4,
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Create Help Request
        </Typography>

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
          <Button type="submit" variant="contained" size="large">
            Create Request
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
