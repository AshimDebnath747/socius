import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

type ImageUploadProps = {
  image: File | null;
  onImageChange: (file: File | null) => void;
};

const ImageUpload = ({ image, onImageChange }: ImageUploadProps) => {
  // const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  useEffect(() => {
  if (!image) {
    setPreview("");
  }
}, [image]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    onImageChange(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    useEffect(() => {
      return () => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      };
    }, [preview]);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={600}>
        Post Image
      </Typography>

      <Box
        sx={{
          width: "100%",
          height: 250,
          borderRadius: 3,
          border: "2px dashed",
          borderColor: "divider",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        {preview ? (
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Typography color="text.secondary">No image selected</Typography>
        )}
      </Box>

      <Button
        component="label"
        variant="outlined"
        startIcon={<CloudUploadIcon />}
      >
        Upload Image
        <input hidden type="file" accept="image/*" onChange={handleChange} />
      </Button>

      {image && (
        <Typography variant="body2" color="text.secondary">
          {image.name}
        </Typography>
      )}
    </Stack>
  );
};

export default ImageUpload;
