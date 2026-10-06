import { UsersAdmin } from "@/components/admin/UsersSettings";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Admin users" };
export default async function Page() { await guardPage("admins:manage"); return <UsersAdmin />; }
