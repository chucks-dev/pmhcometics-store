import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { createAdmin } from "@/server/auth/admin-users";
import { logAdmin } from "@/server/admin/helpers";
import { query } from "@/server/db/client";
import { HttpError, ok, parseJson, route } from "@/server/http";
import { adminPassword, email } from "@/lib/validation/auth";

export const GET = route(async () => {
  await requireAdmin("admins:manage");
  return ok({ items: await query(
    `SELECT id, email, full_name AS "fullName", role, status, last_login_at AS "lastLoginAt", created_at AS "createdAt" FROM admin_users ORDER BY created_at`) });
});

export const POST = route(async (req) => {
  const ctx = await requireAdmin("admins:manage");
  const a = await parseJson(req, z.object({
    email, fullName: z.string().trim().min(2).max(100), password: adminPassword,
    role: z.enum(["super_admin", "product_manager", "order_manager", "support_admin"]),
  }));
  try {
    const created = await createAdmin({ ...a, createdBy: ctx.admin.id });
    await logAdmin(ctx, req, "admin.create", "admin_user", created.id, { email: a.email, role: a.role });
    // otpauthUri is shown once so the new admin can add it to an authenticator app.
    return ok({ id: created.id, otpauthUri: created.otpauthUri }, { status: 201 });
  } catch (e: any) {
    if (e.code === "23505") throw new HttpError(409, "An admin with that email already exists.");
    throw e;
  }
});
