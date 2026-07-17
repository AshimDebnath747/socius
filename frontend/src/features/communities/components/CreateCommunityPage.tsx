import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Avatar, IconButton } from "@mui/material";
import AddAPhotoRoundedIcon from "@mui/icons-material/AddAPhotoRounded";
import { useRef, useState } from "react";
import {
  createCommunity,
  type CreateCommunityPayload,
} from "../../../services/community.service";
import AvatarCropDialog from "../../profile/AvatarCropDialog.tsx";

type CreateCommunityPageProps = {
  onSuccess: () => void;
};

const CreateCommunityPage = ({ onSuccess }: CreateCommunityPageProps) => {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CreateCommunityPayload>({
    name: "",
    description: "",
    rules: "",
    is_private: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setCropOpen(true);
  };

  const handleCrop = (croppedFile: File) => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setAvatar(croppedFile);

    setPreview(URL.createObjectURL(croppedFile));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("rules", form.rules);
      formData.append("is_private", String(form.is_private));

      if (avatar) {
        formData.append("avatar", avatar);
      }

      await createCommunity(formData);

      setForm({
        name: "",
        description: "",
        rules: "",
        is_private: false,
      });
      setAvatar(null);
      setPreview(null);

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to create community.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={2} mb={3}>
      <Paper
        elevation={4}
        sx={{
          width: 650,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Create Community
        </Typography>

        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box display="flex" justifyContent="center" mb={3}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={preview || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              />

              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />

              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                <AddAPhotoRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          <TextField
            label="Community Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            required
          />

          <TextField
            label="Rules"
            name="rules"
            value={form.rules}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_private}
                name="is_private"
                onChange={handleChange}
              />
            }
            label="Private Community"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Community"
            )}
          </Button>
        </Stack>
      </Paper>
      <AvatarCropDialog
        open={cropOpen}
        image={selectedImage}
        onClose={() => setCropOpen(false)}
        onCrop={handleCrop}
      />
    </Box>
  );
};

export default CreateCommunityPage;
