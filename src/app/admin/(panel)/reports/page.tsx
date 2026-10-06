import { ReportsAdmin } from "@/components/admin/ReportsAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Reports" };
export default async function Page() { await guardPage("reports:view"); return <ReportsAdmin />; }
