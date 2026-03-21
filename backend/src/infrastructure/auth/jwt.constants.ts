// Parse JWT expiration time from env (e.g., '7d' -> 604800 seconds)
export function parseJwtExpiresIn(expiresIn: string | undefined): number {
  if (!expiresIn) return 60 * 60 * 24 * 7; // 7 days in seconds

  // Try to parse as number first
  const num = parseInt(expiresIn, 10);
  if (!isNaN(num)) return num;

  // Parse time string like '7d', '2h', etc.
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 60 * 60 * 24 * 7; // Default to 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60; // days to seconds
    case 'h':
      return value * 60 * 60; // hours to seconds
    case 'm':
      return value * 60; // minutes to seconds
    case 's':
      return value; // seconds
    default:
      return 60 * 60 * 24 * 7; // Default to 7 days
  }
}

// JWT_CONSTANTS now computed from ConfigService in auth.module.ts
// See: presentation/auth/auth.module.ts
