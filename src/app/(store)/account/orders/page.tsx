import Link from "next/link";
import { StatusBadge } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/forms";
import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await query<any>(
    `SELECT o.id, o.order_number, o.status, o.total_kobo, o.created_at, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int AS items
       FROM orders o WHERE o.user_id = $1 AND o.status <> 'pending_payment' ORDER BY o.created_at DESC`, [user.id]);
  return (
    <>
      <h1 className="mb-6 text-3xl">My orders</h1>
      {!orders.length ? <EmptyState title="No orders yet" text="When you place an order it will show up here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} /> : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="card flex items-center justify-between gap-4 p-5 hover:border-brand-300">
                <div><p className="font-semibold">#{o.order_number}</p><p className="text-sm text-muted">{new Date(o.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })} · {o.items} {o.items === 1 ? "item" : "items"}</p></div>
                <div className="text-right"><p className="font-semibold">{formatNaira(o.total_kobo)}</p><StatusBadge status={o.status} /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
