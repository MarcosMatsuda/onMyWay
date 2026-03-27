/**
 * ETA configuration constants
 */

/**
 * Maximum age in minutes for ETA records to be considered valid.
 * ETAs older than this threshold are excluded from arrivals and stats queries.
 * Default: 5 minutes
 */
export const ETA_TTL_MINUTES = 5;
