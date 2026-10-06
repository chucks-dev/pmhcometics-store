import { Dashboard } from "@/components/admin/Dashboard";
import { guardPage } from "@/server/admin/page-guard";

export const metadata = { title: "Dashboard" };
export default async function Page() { await guardPage("dashboard:view"); return <Dashboard />; }
