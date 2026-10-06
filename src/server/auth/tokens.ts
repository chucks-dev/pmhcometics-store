import { query } from "../db/client";
import { randomToken, sha256 } from "../security/crypto";

export type TokenPurpose = "verify_email" | "reset_password";

/** Issues a single-use token; older unused tokens of the same purpose are invalidated. */
export async function issueToken(userId: string, purpose: TokenPurpose, ttlMinutes: number): Promise<string> {
  await query(
    `UPDATE email_tokens SET used_at = now() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`,
    [userId, purpose],
  );
  const token = randomToken();
  await query(
    `INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [userId, purpose, sha256(token), ttlMinutes],
  );
  return token;
}

/** Atomically consumes a valid token. Returns the user id, or null if invalid/expired/used. */
export async function consumeToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  const rows = await query<{ user_id: string }>(
    `UPDATE email_tokens SET used_at = now()
      WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
      RETURNING user_id`,
    [sha256(token), purpose],
  );
  return rows[0]?.user_id ?? null;
}
