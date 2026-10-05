import {
  ImageUploadPolicyPreset,
  processUploadedImage,
} from '../media-upload/process-uploaded-image.util';

export async function normalizeUserAvatar(buffer: Buffer): Promise<{ data: Buffer; ext: string }> {
  const result = await processUploadedImage(buffer, ImageUploadPolicyPreset.AVATAR);
  return { data: result.data, ext: result.ext };
}

export const AVATAR_MAX_BYTES = ImageUploadPolicyPreset.AVATAR.maxInputBytes;
export const AVATAR_OUTPUT_SIZE = ImageUploadPolicyPreset.AVATAR.outputSize ?? 512;
