import { cookies } from "next/headers";
import { query } from "../db/client";
import { env } from "../env";
import { randomToken, sha256 } from "../security/crypto";

export type SessionKind = "customer" | "admin";

const CFG = {
  customer: { cookie: "cos_session", table: "user_sessions", col: "user_id", ttlMs: 30 * 24 * 3600_000, sameSite: "lax" },
  admin: { cookie: "cos_admin_session", table: "admin_sessions", col: "admin_id", ttlMs: 8 * 3600_000, sameSite: "strict" },
} as const;

export async function createSession(
  kind: SessionKind,
  subjectId: string,
  meta: { ip?: string; userAgent?: string; mfaVerified?: boolean } = {},
): Promise<void> {
  const c = CFG[kind];
  const token = randomToken();
  const expires = new Date(Date.now() + c.ttlMs);
  const tokenHash = sha256(token); // only the hash is stored; a DB leak can't be replayed

  if (kind === "admin") {
    await query(
      `INSERT INTO admin_sessions (admin_id, token_hash, mfa_verified, ip, user_agent, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [subjectId, tokenHash, meta.mfaVerified ?? false, meta.ip ?? null, meta.userAgent?.slice(0, 300) ?? null, expires],
    );
  } else {
    await query(
      `INSERT INTO user_sessions (user_id, token_hash, ip, user_agent, expires_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [subjectId, tokenHash, meta.ip ?? null, meta.userAgent?.slice(0, 300) ?? null, expires],
    );
  }

  (await cookies()).set(c.cookie, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: c.sameSite,
    path: "/",
    expires,
  });
}

export interface ActiveSession {
  id: string;
  subjectId: string;
  mfaVerified: boolean;
}

export async function getSession(kind: SessionKind): Promise<ActiveSession | null> {
  const c = CFG[kind];
  const token = (await cookies()).get(c.cookie)?.value;
  if (!token) return null;
  const mfaCol = kind === "admin" ? "mfa_verified" : "true AS mfa_verified";
  const rows = await query<{ id: string; subject_id: string; mfa_verified: boolean }>(
    `SELECT id, ${c.col} AS subject_id, ${mfaCol}
       FROM ${c.table}
      WHERE token_hash = $1 AND expires_at > now() AND revoked_at IS NULL`,
    [sha256(token)],
  );
  const r = rows[0];
  return r ? { id: r.id, subjectId: r.subject_id, mfaVerified: r.mfa_verified } : null;
}

export async function markAdminSessionMfaVerified(sessionId: string): Promise<void> {
  await query(`UPDATE admin_sessions SET mfa_verified = true WHERE id = $1`, [sessionId]);
}

export async function destroySession(kind: SessionKind): Promise<void> {
  const c = CFG[kind];
  const jar = await cookies();
  const token = jar.get(c.cookie)?.value;
  if (token) {
    await query(`UPDATE ${c.table} SET revoked_at = now() WHERE token_hash = $1`, [sha256(token)]);
  }
  jar.delete(c.cookie);
}

export async function revokeAllSessions(kind: SessionKind, subjectId: string): Promise<void> {
  const c = CFG[kind];
  await query(`UPDATE ${c.table} SET revoked_at = now() WHERE ${c.col} = $1 AND revoked_at IS NULL`, [subjectId]);
}
