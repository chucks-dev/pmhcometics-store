import { OrderAdminDetail } from "@/components/admin/OrdersAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Order" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { await guardPage("orders:read"); return <OrderAdminDetail id={(await params).id} />; }
