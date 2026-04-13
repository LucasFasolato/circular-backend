import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { imageSize } from 'image-size';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { FILE_LIMITS } from '../domain/listing-limits.constants';

export interface UploadedPhotoFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredListingPhoto {
  objectKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class LocalListingPhotoStorageService {
  async storePhoto(
    listingId: string,
    file: UploadedPhotoFile,
  ): Promise<StoredListingPhoto> {
    this.validateFile(file);

    const dimensions = imageSize(file.buffer);
    const width = dimensions.width ?? 0;
    const height = dimensions.height ?? 0;

    if (
      width < FILE_LIMITS.MIN_PHOTO_WIDTH ||
      height < FILE_LIMITS.MIN_PHOTO_HEIGHT
    ) {
      throw new ValidationAppError('Photo dimensions are too small', [
        {
          field: 'photos',
          message: `Each photo must be at least ${FILE_LIMITS.MIN_PHOTO_WIDTH}x${FILE_LIMITS.MIN_PHOTO_HEIGHT}`,
        },
      ]);
    }

    const extension = MIME_EXTENSION_MAP[file.mimetype];
    const filename = `${randomUUID()}.${extension}`;
    const objectKey = join('listings', listingId, filename).replace(/\\/g, '/');
    const absolutePath = join(process.cwd(), 'uploads', objectKey);

    await mkdir(join(process.cwd(), 'uploads', 'listings', listingId), {
      recursive: true,
    });
    await writeFile(absolutePath, file.buffer);

    return {
      objectKey,
      publicUrl: `/uploads/${objectKey}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      width,
      height,
    };
  }

  private validateFile(file: UploadedPhotoFile): void {
    if (
      !FILE_LIMITS.ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as never)
    ) {
      throw new ValidationAppError('Photo mime type is not allowed', [
        {
          field: 'photos',
          message: `Allowed mime types: ${FILE_LIMITS.ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
        },
      ]);
    }

    if (file.size > FILE_LIMITS.MAX_PHOTO_SIZE_BYTES) {
      throw new ValidationAppError('Photo size exceeds limit', [
        {
          field: 'photos',
          message: `Each photo must be at most ${FILE_LIMITS.MAX_PHOTO_SIZE_BYTES} bytes`,
        },
      ]);
    }
  }
}
