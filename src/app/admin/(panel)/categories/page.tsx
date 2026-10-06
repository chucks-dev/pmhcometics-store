import { CategoriesAdmin } from "@/components/admin/CategoriesAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Categories" };
export default async function Page() { await guardPage("products:read"); return <CategoriesAdmin />; }
