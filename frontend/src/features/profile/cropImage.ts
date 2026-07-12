export default async function getCroppedImg(
  imageSrc: string,
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<File> {
  const image = new Image();

  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = crop.width;
  canvas.height = crop.height;

  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Canvas is empty");
      }

      resolve(
        new File([blob], "avatar.jpg", {
          type: "image/jpeg",
        })
      );
    }, "image/jpeg");
  });
}