import { NotificationsAdmin } from "@/components/admin/NotificationsAdmin";
import { can } from "@/server/auth/rbac";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Notifications" };
export default async function Page() { const { admin } = await guardPage("dashboard:view"); return <NotificationsAdmin canSend={can(admin.role, "notifications:send")} />; }
