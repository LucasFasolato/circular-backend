import { LISTING_LIMITS } from './listing-limits.constants';

export function deriveQualityLabels(
  qualityScore: number | null,
  approvedOrPendingPhotoCount: number,
): string[] {
  const labels: string[] = [];

  if ((qualityScore ?? 0) >= 80) {
    labels.push('HIGH_QUALITY');
  }

  if (approvedOrPendingPhotoCount >= LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT) {
    labels.push('GOOD_PHOTOS');
  }

  return labels;
}
