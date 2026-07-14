import { useState } from "react";
import {
    Box,
    Button,
    Stack,
    Typography,
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const ImageUpload = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setImage(file);
        setPreview(URL.createObjectURL(file));
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
                    <Typography color="text.secondary">
                        No image selected
                    </Typography>
                )}
            </Box>

            <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
            >
                Upload Image

                <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                />
            </Button>

            {image && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {image.name}
                </Typography>
            )}
        </Stack>
    );
};

export default ImageUpload;