import type { OcrFilterPreset } from "./types";

export interface CropRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreprocessOptions {
  rotation: 0 | 90 | 180 | 270;
  filter: OcrFilterPreset;
  cropRect?: CropRectangle | null;
}

const MAX_IMAGE_DIMENSION = 2000;

export const preprocessImage = async (
  file: File,
  options: PreprocessOptions
): Promise<string> => {
  if (typeof window === "undefined") {
    return "";
  }

  const imageBitmap = await createImageBitmap(file);
  const isRotatedQuarter = options.rotation === 90 || options.rotation === 270;

  let targetWidth = isRotatedQuarter ? imageBitmap.height : imageBitmap.width;
  let targetHeight = isRotatedQuarter ? imageBitmap.width : imageBitmap.height;

  if (targetWidth <= 0 || targetHeight <= 0) {
    return URL.createObjectURL(file);
  }

  // Downscale large phone camera captures to prevent high memory usage
  let scale = 1;
  const largestSide = Math.max(targetWidth, targetHeight);
  if (largestSide > MAX_IMAGE_DIMENSION) {
    scale = MAX_IMAGE_DIMENSION / largestSide;
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return URL.createObjectURL(file);
  }

  // Apply rotation
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((options.rotation * Math.PI) / 180);

  const drawWidth = isRotatedQuarter ? canvas.height : canvas.width;
  const drawHeight = isRotatedQuarter ? canvas.width : canvas.height;
  ctx.drawImage(imageBitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  // Apply sub-region cropping if requested
  if (
    options.cropRect &&
    options.cropRect.width > 20 &&
    options.cropRect.height > 20
  ) {
    const cropX = Math.max(0, Math.round(options.cropRect.x * scale));
    const cropY = Math.max(0, Math.round(options.cropRect.y * scale));
    const cropW = Math.min(canvas.width - cropX, Math.round(options.cropRect.width * scale));
    const cropH = Math.min(canvas.height - cropY, Math.round(options.cropRect.height * scale));

    if (cropW > 10 && cropH > 10) {
      const croppedImageData = ctx.getImageData(cropX, cropY, cropW, cropH);
      canvas.width = cropW;
      canvas.height = cropH;
      ctx.putImageData(croppedImageData, 0, 0);
    }
  }

  // Apply pixel filters based on preset
  if (options.filter === "natural") {
    return canvas.toDataURL("image/png");
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  if (options.filter === "high_contrast") {
    // High-contrast binarization tuned for whiteboards & blackboards
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const binaryVal = gray > 132 ? 255 : 0;
      data[i] = binaryVal;
      data[i + 1] = binaryVal;
      data[i + 2] = binaryVal;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  if (options.filter === "adaptive") {
    // Contrast stretch with midtone enhancement for phone shadows
    let minGray = 255;
    let maxGray = 0;

    // First pass: find luminance range
    for (let i = 0; i < data.length; i += 8) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (g < minGray) minGray = g;
      if (g > maxGray) maxGray = g;
    }

    const range = Math.max(1, maxGray - minGray);

    // Second pass: stretch and boost contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const normalized = ((gray - minGray) / range) * 255;
      const enhanced = normalized > 140 ? 255 : normalized < 80 ? 0 : normalized;
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  return canvas.toDataURL("image/png");
};
