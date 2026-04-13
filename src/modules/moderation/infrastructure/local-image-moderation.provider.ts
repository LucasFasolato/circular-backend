import { Injectable } from '@nestjs/common';
import { ImageAuditStatus } from '../../listings/domain/image-audit-status.enum';
import {
  AuditImageInput,
  AuditImageResult,
  ImageModerationProvider,
} from '../domain/image-moderation-provider.interface';
import { ModerationReasonCode } from '../domain/moderation-reason-code.enum';
import { ModerationReason } from '../domain/moderation-reason.interface';

@Injectable()
export class LocalImageModerationProvider implements ImageModerationProvider {
  auditImage(input: AuditImageInput): Promise<AuditImageResult> {
    const reasons: ModerationReason[] = [];

    if (input.width < 800 || input.height < 800) {
      reasons.push({
        code: ModerationReasonCode.PHOTO_BLURRY,
        message:
          'La foto necesita mejor definición o resolución para una revisión confiable.',
      });
    }

    if (input.sizeBytes < 150_000) {
      reasons.push({
        code: ModerationReasonCode.PHOTO_TOO_DARK,
        message:
          'La foto parece tener baja calidad visual o iluminación insuficiente.',
      });
    }

    return Promise.resolve({
      status:
        reasons.length > 0
          ? ImageAuditStatus.OBSERVED
          : ImageAuditStatus.APPROVED,
      reasons,
      providerName: 'local-stub',
      providerPayload: {
        dimensions: {
          width: input.width,
          height: input.height,
        },
        sizeBytes: input.sizeBytes,
      },
      auditedAt: new Date(),
    });
  }
}
