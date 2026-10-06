import { ProductsAdmin } from "@/components/admin/ProductsAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Products" };
export default async function Page() { await guardPage("products:read"); return <ProductsAdmin />; }
