import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
} from "@mui/material";

import ProfileHeader from "./ProfileHeader";
import StatsSection from "./StatsSection";
// import ActivitySection from "./ActivitySection";
import CommunitySection from "./CommunitySection";
import { useEffect, useState } from "react";
import {
  getUserProfile,
  uploadAvatar,
  updateProfile,
} from "../../services/user.service";
import type { ProfileData } from "../../types/user";

const UserProfile = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [formData, setFormData] = useState({
    name: "",

    headline: "",
    bio: "",
    about: "",
    location: "",
    website: "",
    skills: "",
  });

  const handleSelectAvatar = (file: File) => {
    setSelectedFile(file);

    const previewUrl = URL.createObjectURL(file);

    setPreview(previewUrl);
  };
  const handleSaveProfile = async () => {
    try {
      setUploading(true);

      const updatedProfile = await updateProfile({
        ...formData,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      let updatedUser = updatedProfile;

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
        skills: updatedUser.skills || [],
      });

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedUser,
        }),
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
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();

        // res.data is your JSON response
        setProfile(res);

        setFormData({
          name: res.user.name || "",
          headline: res.user.headline || "",
          bio: res.user.bio || "",
          about: res.user.about || "",
          location: res.user.location || "",
          website: res.user.website || "",
          skills: res.user.skills || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column */}
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

                    setEditMode(false);
                    setPreview(null);
                    setSelectedFile(null);

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

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <StatsSection userStats={profile!.stats} />
            {/* <ActivitySection /> */}
          </Stack>
        </Grid>
      </Grid>
      <Box mt={3}>
        <CommunitySection communities={profile!.communities} />
      </Box>
    </Container>
  );
};

export default UserProfile;
