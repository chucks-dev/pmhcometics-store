import { requireAdmin } from "@/server/auth/guards";
import { PERMISSIONS, can } from "@/server/auth/rbac";
import { ok, route } from "@/server/http";

// The admin UI uses `permissions` only to hide menu items. Real enforcement is server-side.
export const GET = route(async () => {
  const { admin } = await requireAdmin("dashboard:view");
  return ok({
    admin: { id: admin.id, email: admin.email, fullName: admin.full_name, role: admin.role },
    permissions: PERMISSIONS.filter((p) => can(admin.role, p)),
  });
});
