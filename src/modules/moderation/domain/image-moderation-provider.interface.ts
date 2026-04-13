import { ImageAuditStatus } from '../../listings/domain/image-audit-status.enum';
import { ModerationReason } from './moderation-reason.interface';

export interface AuditImageInput {
  listingId: string;
  photoId: string;
  objectKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface AuditImageResult {
  status: ImageAuditStatus;
  reasons: ModerationReason[];
  providerName: string;
  providerPayload: Record<string, unknown> | null;
  auditedAt: Date | null;
}

export interface ImageModerationProvider {
  auditImage(input: AuditImageInput): Promise<AuditImageResult>;
}

export const IMAGE_MODERATION_PROVIDER = 'IMAGE_MODERATION_PROVIDER';
