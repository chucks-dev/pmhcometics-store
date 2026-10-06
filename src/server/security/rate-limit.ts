import { query } from "../db/client";
import { HttpError } from "../http";

/**
 * Fixed-window limiter backed by Postgres, so it works across multiple server instances.
 * Throws 429 when `key` exceeds `limit` hits within `windowSec`.
 * Housekeeping: DELETE FROM rate_limits WHERE window_start < now() - interval '1 day' (cron).
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<void> {
  const rows = await query<{ count: number }>(
    `INSERT INTO rate_limits (key, window_start, count)
     VALUES ($1, to_timestamp(floor(extract(epoch from now()) / $2::int) * $2::int), 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [key, windowSec],
  );
  if (rows[0].count > limit) {
    throw new HttpError(429, "Too many attempts. Please try again later.", "RATE_LIMITED");
  }
}
