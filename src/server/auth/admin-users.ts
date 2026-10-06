import { query } from "../db/client";
import { adminPassword } from "@/lib/validation/auth";
import { encrypt } from "../security/crypto";
import { hashPassword } from "./password";
import type { AdminRole } from "./rbac";
import { generateTotpSecret, totpUri } from "./totp";

/**
 * Admins are never self-registered. They're created by a super admin (or the seed script).
 * 2FA is provisioned at creation, so a stolen password alone can never enrol an attacker's authenticator.
 * Show `otpauthUri` to the new admin once (as a QR code) and never store it.
 */
export async function createAdmin(input: {
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
  createdBy?: string;
}): Promise<{ id: string; otpauthUri: string }> {
  adminPassword.parse(input.password);
  const secret = generateTotpSecret();
  const rows = await query<{ id: string }>(
    `INSERT INTO admin_users (email, full_name, password_hash, role, totp_secret_enc, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [input.email.toLowerCase(), input.fullName, await hashPassword(input.password), input.role, encrypt(secret), input.createdBy ?? null],
  );
  return { id: rows[0].id, otpauthUri: totpUri(input.email, secret) };
}
