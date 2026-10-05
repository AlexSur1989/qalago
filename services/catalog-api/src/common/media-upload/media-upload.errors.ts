import { BadRequestException } from '@nestjs/common';

export const MediaUploadErrorCode = {
  INVALID_IMAGE_TYPE: 'INVALID_IMAGE_TYPE',
  INVALID_IMAGE_DATA: 'INVALID_IMAGE_DATA',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  IMAGE_DIMENSIONS_TOO_LARGE: 'IMAGE_DIMENSIONS_TOO_LARGE',
  IMAGE_PROCESSING_FAILED: 'IMAGE_PROCESSING_FAILED',
  UNTRUSTED_MEDIA_URL: 'UNTRUSTED_MEDIA_URL',
  UPLOAD_CONTEXT_REQUIRED: 'UPLOAD_CONTEXT_REQUIRED',
  UPLOAD_LIMIT_REACHED: 'UPLOAD_LIMIT_REACHED',
  UPLOAD_NOT_FOUND: 'UPLOAD_NOT_FOUND',
  UPLOAD_RECEIPT_REQUIRED: 'UPLOAD_RECEIPT_REQUIRED',
  UPLOAD_RECEIPT_INVALID: 'UPLOAD_RECEIPT_INVALID',
} as const;

export type MediaUploadErrorCodeType =
  (typeof MediaUploadErrorCode)[keyof typeof MediaUploadErrorCode];

export function mediaUploadBadRequest(
  code: MediaUploadErrorCodeType,
  message: string,
): BadRequestException {
  return new BadRequestException({ message, code });
}
