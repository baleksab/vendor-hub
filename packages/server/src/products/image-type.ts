export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_OFFSET = 8;

function startsWith(data: Buffer, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => data[offset + index] === byte);
}

export function detectImageType(data: Buffer): ImageType | undefined {
  if (startsWith(data, JPEG_SIGNATURE)) {
    return "image/jpeg";
  }

  if (startsWith(data, PNG_SIGNATURE)) {
    return "image/png";
  }

  if (startsWith(data, RIFF_SIGNATURE) && startsWith(data, WEBP_SIGNATURE, WEBP_OFFSET)) {
    return "image/webp";
  }

  return undefined;
}
