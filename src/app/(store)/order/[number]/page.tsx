import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/forms";
import { OrderDetailView } from "@/components/store/OrderDetailView";
import { getCurrentUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { loadOrderDetail, validTrackingToken } from "@/server/orders";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; confirmed?: string }> }) {
  const { number } = await params; const { t, confirmed } = await searchParams;
  const [row] = await query<{ id: string; user_id: string | null }>(`SELECT id, user_id FROM orders WHERE order_number = $1`, [number]);
  if (!row) notFound();
  const user = await getCurrentUser();
  if (!(validTrackingToken(row.id, t) || (user && row.user_id === user.id))) notFound();
  const order = (await loadOrderDetail(row.id))!;
  const paid = !["pending_payment", "cancelled"].includes(order.status);

  return (
    <div className="container-x max-w-3xl py-8">
      {confirmed === "1" && paid && (
        <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-brand-50 to-blush p-8 text-center">
          <h1 className="text-4xl">Payment Successful 🎉</h1>
          <p className="mt-3 text-lg">Order #{order.orderNumber}</p>
          <p className="text-lg font-semibold">Total Paid: {formatNaira(order.totalKobo)}</p>
          <p className="mt-2 text-muted">We&apos;ve emailed your confirmation to {order.customerEmail}.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="#details" variant="dark">View Order</ButtonLink>
            <ButtonLink href="#tracking" variant="outline">Track Order</ButtonLink>
            <ButtonLink href="/shop" variant="ghost">Continue Shopping</ButtonLink>
          </div>
        </div>
      )}
      <h2 id="tracking" className="scroll-mt-24 text-3xl">Order tracking</h2>
      <p className="mb-5 text-muted">Order #{order.orderNumber}</p>
      <div className="card p-6"><OrderStatus status={order.status} history={order.history} /></div>
      <div id="details" className="mt-8 scroll-mt-24"><OrderDetailView order={order} /></div>
      {user && <p className="mt-6 text-sm"><Link href="/account/orders" className="text-brand-600 underline">See all my orders</Link></p>}
    </div>
  );
}
