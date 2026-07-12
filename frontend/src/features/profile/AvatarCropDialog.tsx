import { useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./cropImage";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
} from "@mui/material";

interface Props {
  open: boolean;
  image: string;
  onClose: () => void;
  onCrop: (file: File) => void;
}

export default function AvatarCropDialog({
  open,
  image,
  onClose,
  onCrop,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = (
    _: any,
    croppedAreaPixelsValue: any
  ) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  };

  const handleCrop = async () => {
    try {
      if (!croppedAreaPixels) return;

      const croppedFile = await getCroppedImg(
        image,
        croppedAreaPixels
      );

      onCrop(croppedFile);

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Crop Profile Picture</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 400,
            bgcolor: "black",
          }}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </Box>

        <Slider
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          onChange={(_, value) => setZoom(value as number)}
          sx={{ mt: 3 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleCrop}
        >
          Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
}