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
import { useState } from "react";
import {
  createCommunity,
  type CreateCommunityPayload,
} from "../../../services/community.service";

type CreateCommunityPageProps = {
  onSuccess: () => void;
};

const CreateCommunityPage = ({
  onSuccess,
}: CreateCommunityPageProps) => {
  const [form, setForm] = useState<CreateCommunityPayload>({
    name: "",
    description: "",
    rules: "",
    is_private: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createCommunity(form);

      setForm({
        name: "",
        description: "",
        rules: "",
        is_private: false,
      });

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to create community.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      mt={2}
      mb={3}
    >
      <Paper
        elevation={4}
        sx={{
          width: 650,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          mb={3}
        >
          Create Community
        </Typography>

        <Stack
          component="form"
          spacing={3}
          onSubmit={handleSubmit}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

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
            rows={4}
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
              <CircularProgress
                size={24}
                color="inherit"
              />
            ) : (
              "Create Community"
            )}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CreateCommunityPage;