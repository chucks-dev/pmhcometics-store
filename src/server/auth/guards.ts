import { query } from "../db/client";
import { HttpError } from "../http";
import { can, type AdminRole, type Permission } from "./rbac";
import { getSession } from "./session";

export interface CurrentUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await getSession("customer");
  if (!s) return null;
  const rows = await query<CurrentUser>(
    `SELECT id, full_name, email, phone FROM users
      WHERE id = $1 AND status = 'active' AND email_verified_at IS NOT NULL`,
    [s.subjectId],
  );
  return rows[0] ?? null;
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new HttpError(401, "Please log in to continue.", "UNAUTHENTICATED");
  return u;
}

export interface CurrentAdmin {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
}

export interface AdminContext {
  admin: CurrentAdmin;
  sessionId: string;
  mfaVerified: boolean;
}

/**
 * Server-side admin gate. Call at the top of EVERY admin route handler and admin page/layout.
 * Order: session -> account still active -> MFA completed -> role permission.
 */
export async function requireAdmin(
  permission?: Permission,
  opts: { allowPendingMfa?: boolean } = {},
): Promise<AdminContext> {
  const s = await getSession("admin");
  if (!s) throw new HttpError(401, "Admin login required.", "UNAUTHENTICATED");

  const rows = await query<CurrentAdmin>(
    `SELECT id, email, full_name, role FROM admin_users WHERE id = $1 AND status = 'active'`,
    [s.subjectId],
  );
  const admin = rows[0];
  if (!admin) throw new HttpError(401, "Admin login required.", "UNAUTHENTICATED");

  if (!s.mfaVerified && !opts.allowPendingMfa) {
    throw new HttpError(401, "Two-factor verification required.", "MFA_REQUIRED");
  }
  if (permission && !can(admin.role, permission)) {
    throw new HttpError(403, "You don't have permission to do that.", "FORBIDDEN");
  }
  return { admin, sessionId: s.id, mfaVerified: s.mfaVerified };
}
