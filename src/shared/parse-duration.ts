/**
 * Parses a duration string like '15m', '7d', '1h', '30s' into seconds.
 * Falls back to the provided default if the format is unrecognized.
 */
export function parseDurationToSeconds(
  duration: string,
  fallbackSeconds = 900,
): number {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    return fallbackSeconds;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * (multipliers[unit] ?? 1);
}
