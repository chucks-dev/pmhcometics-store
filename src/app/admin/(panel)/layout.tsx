import { AdminShell } from "@/components/admin/AdminShell";
import { PERMISSIONS, can } from "@/server/auth/rbac";
import { guardPage } from "@/server/admin/page-guard";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { admin } = await guardPage();
  return (
    <AdminShell admin={{ fullName: admin.full_name, email: admin.email, role: admin.role }} permissions={PERMISSIONS.filter((p) => can(admin.role, p))}>
      {children}
    </AdminShell>
  );
}
