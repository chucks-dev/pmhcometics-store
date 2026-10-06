import { ProductForm } from "@/components/admin/ProductForm";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Add product" };
export default async function Page() { await guardPage("products:write"); return <ProductForm />; }
