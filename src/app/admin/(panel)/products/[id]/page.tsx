import { ProductForm } from "@/components/admin/ProductForm";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Edit product" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { await guardPage("products:write"); return <ProductForm id={(await params).id} />; }
