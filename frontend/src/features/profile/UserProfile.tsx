import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
} from "@mui/material";
import AvatarCropDialog from "./AvatarCropDialog";
import ProfileHeader from "./ProfileHeader";
import StatsSection from "./StatsSection";
import CommunitySection from "./CommunitySection";
import { useEffect, useState } from "react";
import {
  getUserProfile,
  uploadAvatar,
  updateProfile,
} from "../../services/user.service";
import type { ProfileData } from "../../types/user";

const UserProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    bio: "",
    about: "",
    location: "",
    website: "",
    skills: "",
  });

  // =========================
  // Avatar Selection
  // =========================

  const handleSelectAvatar = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropOpen(true);
    };

    reader.readAsDataURL(file);
  };

  // =========================
  // Save Profile
  // =========================

  const handleSaveProfile = async () => {
    try {
      setUploading(true);

      let updatedUser = await updateProfile({
        ...formData,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      if (selectedFile) {
        const avatarForm = new FormData();
        avatarForm.append("avatar", selectedFile);

        updatedUser = await uploadAvatar(avatarForm);
      }

      setProfile((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          user: {
            ...prev.user,
            ...updatedUser,
          },
        };
      });

      setFormData({
        name: updatedUser.name || "",
        headline: updatedUser.headline || "",
        bio: updatedUser.bio || "",
        about: updatedUser.about || "",
        location: updatedUser.location || "",
        website: updatedUser.website || "",
        skills: updatedUser.skills?.join(", ") || "",
      });

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedUser,
        })
      );

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setPreview(null);
      setSelectedFile(null);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // Fetch Profile
  // =========================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();

        setProfile(res);

        setFormData({
          name: res.user.name || "",
          headline: res.user.headline || "",
          bio: res.user.bio || "",
          about: res.user.about || "",
          location: res.user.location || "",
          website: res.user.website || "",
          skills: res.user.skills?.join(", ") || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <ProfileHeader
              user={profile.user}
              preview={preview}
              editMode={editMode}
              setEditMode={setEditMode}
              formData={formData}
              setFormData={setFormData}
              onSelectAvatar={handleSelectAvatar}
            />

            {editMode && (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (preview) {
                      URL.revokeObjectURL(preview);
                    }

                    setPreview(null);
                    setSelectedFile(null);
                    setEditMode(false);

                    setFormData({
                      name: profile.user.name || "",
                      headline: profile.user.headline || "",
                      bio: profile.user.bio || "",
                      about: profile.user.about || "",
                      location: profile.user.location || "",
                      website: profile.user.website || "",
                      skills: profile.user.skills?.join(", ") || "",
                    });
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={uploading}
                >
                  {uploading ? "Saving..." : "Save Changes"}
                </Button>
              </Stack>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <StatsSection userStats={profile.stats} />
          </Stack>
        </Grid>
      </Grid>

      <Box mt={3}>
        <CommunitySection communities={profile.communities} />
      </Box>

      <AvatarCropDialog
        open={cropOpen}
        image={imageSrc}
        onClose={() => setCropOpen(false)}
        onCrop={(file) => {
          setSelectedFile(file);

          const previewUrl = URL.createObjectURL(file);

          setPreview(previewUrl);

          setCropOpen(false);
        }}
      />
    </Container>
  );
};

export default UserProfile;