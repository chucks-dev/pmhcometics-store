import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/store/OrderDetailView";
import { OrderStatus } from "@/components/ui/display";
import { requireUser } from "@/server/auth/guards";
import { loadOrderDetail } from "@/server/orders";
import { query } from "@/server/db/client";

export const metadata = { title: "Order details" };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [own] = await query(`SELECT 1 FROM orders WHERE id = $1 AND user_id = $2`, [id, user.id]);
  if (!own) notFound();
  const order = (await loadOrderDetail(id))!;
  return (
    <>
      <h1 className="mb-6 text-3xl">Order #{order.orderNumber}</h1>
      <div className="card mb-6 p-6"><OrderStatus status={order.status} history={order.history} /></div>
      <OrderDetailView order={order} />
    </>
  );
}
