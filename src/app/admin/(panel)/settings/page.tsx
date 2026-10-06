import { SettingsAdmin } from "@/components/admin/UsersSettings";
import { can } from "@/server/auth/rbac";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Settings" };
export default async function Page() { const { admin } = await guardPage("settings:manage"); return <SettingsAdmin canAudit={can(admin.role, "audit:read")} />; }
