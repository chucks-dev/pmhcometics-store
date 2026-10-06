import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Orders" };
export default async function Page() { await guardPage("orders:read"); return <OrdersAdmin />; }
