import { ContentAdmin } from "@/components/admin/ContentAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Homepage content" };
export default async function Page() { await guardPage("content:write"); return <ContentAdmin />; }
