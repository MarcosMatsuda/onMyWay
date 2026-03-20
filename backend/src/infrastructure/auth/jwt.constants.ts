// Parse JWT expiration time from env (e.g., '7d' -> 604800 seconds)
function parseJwtExpiresIn(expiresIn: string | undefined): number {
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

export const JWT_CONSTANTS = {
  secret: process.env.JWT_SECRET || 'change-this-to-a-secure-random-string',
  expiresIn: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN),
};
