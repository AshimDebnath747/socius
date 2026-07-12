import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonth";
import { type User } from "../../types/user.ts";
import { useRef } from "react";
interface Props {
  user: User;
  preview: string | null;

  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;

  formData: {
    name: string;
    headline: string;
    bio: string;
    about: string;
    location: string;
    website: string;
    skills: string;
  };

  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      headline: string;
      bio: string;
      about: string;
      location: string;
      website: string;
      skills: string;
    }>
  >;

  onSelectAvatar: (file: File) => void;
}

export default function ProfileHeader({
  user,
  preview,
  editMode,
  setEditMode,
  formData,
  setFormData,
  onSelectAvatar,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    onSelectAvatar(file);
  };
  const joined = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <Paper
      elevation={3}
      sx={{
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      {/* Cover */}
      <Box
        sx={{
          height: 180,
          background:
            "linear-gradient(135deg,#2563EB 0%,#4F46E5 45%,#7C3AED 100%)",
        }}
      />

      <Box sx={{ px: 4, pb: 4 }}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "center",
            md: "flex-start",
          }}
        >
          <Stack
            spacing={2}
            alignItems={{
              xs: "center",
              md: "flex-start",
            }}
            sx={{
              mt: -8,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={
                  preview || `${import.meta.env.VITE_BACKEND_URL}${user.avatar}`
                }
                onClick={() => {
                  if (editMode) {
                    fileInputRef.current?.click();
                  }
                }}
                sx={{
                  width: 130,
                  height: 130,
                  border: "5px solid white",
                  boxShadow: 4,
                  cursor: editMode ? "pointer" : "default",
                }}
              />

              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              {editMode && (
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Box
              textAlign={{
                xs: "center",
                md: "left",
              }}
            >
              {editMode ? (
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              ) : (
                <Typography fontWeight={700} variant="h4">
                  {user?.name ?? "email"}
                </Typography>
              )}

              <Typography color="text.secondary" mt={1}>
                {user?.email ?? "No email"}
              </Typography>

              {editMode ? (
                <TextField
                  fullWidth
                  size="small"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headline: e.target.value,
                    }))
                  }
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography mt={1} fontWeight={500}>
                  {user?.headline ?? "Headline"}
                </Typography>
              )}

              {editMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography color="text.secondary" mt={1}>
                  {user?.bio ?? "No bio"}
                </Typography>
              )}
            </Box>
          </Stack>

          <IconButton
            color="primary"
            onClick={() => setEditMode(true)}
            sx={{
              bgcolor: "white",
              color: "gray",
              width: 40,
              height: 40,

              "&:hover": {
                bgcolor: "#f5f5f5",
              },
            }}
          >
            <EditIcon />
          </IconButton>
        </Stack>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={3}
          mt={4}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnRoundedIcon fontSize="small" />

            {editMode ? (
              <TextField
                size="small"
                fullWidth
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            ) : (
              <Typography color="text.secondary">
                {user?.location ?? "Location"}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <LanguageRoundedIcon fontSize="small" />

            {editMode ? (
              <TextField
                size="small"
                fullWidth
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
              />
            ) : (
              <Link
                href={user?.website}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="inherit"
              >
                Portfolio
              </Link>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <CalendarMonthRoundedIcon fontSize="small" />
            <Typography color="text.secondary">
              {joined ?? "joining date"}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={600} mb={2}>
          Skills
        </Typography>

        {editMode ? (
          <TextField
            fullWidth
            label="Skills"
            helperText="Separate skills with commas"
            value={formData.skills}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                skills: e.target.value,
              }))
            }
          />
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {user?.skills?.map((skill) => (
              <Chip key={skill} label={skill} color="primary" />
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={600}>
          About
        </Typography>

        {editMode ? (
          <TextField
            fullWidth
            multiline
            rows={5}
            value={formData.about}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                about: e.target.value,
              }))
            }
          />
        ) : (
          <Typography mt={1} color="text.secondary">
            {user?.about ?? "About"}
          </Typography>
        )}

        {/* <Divider sx={{ my: 4 }} />

        <Stack direction="row" justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              120
            </Typography>

            <Typography color="text.secondary">Posts</Typography>
          </Box>

          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              15
            </Typography>

            <Typography color="text.secondary">Communities</Typography>
          </Box>

          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              450
            </Typography>

            <Typography color="text.secondary">Reputation</Typography>
          </Box>
        </Stack> */}
      </Box>
    </Paper>
  );
}
