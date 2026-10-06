import { StatusBadge } from "@/components/ui/display";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { formatNaira } from "@/lib/money";

export const metadata = { title: "Payment history" };

export default async function PaymentHistory() {
  const user = await requireUser();
  const rows = await query<any>(
    `SELECT p.id, p.reference, p.provider, p.amount_kobo, p.status, p.created_at, o.order_number
       FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.user_id = $1 ORDER BY p.created_at DESC`, [user.id]);
  return (
    <>
      <h1 className="mb-6 text-3xl">Payment history</h1>
      {!rows.length ? <EmptyState title="No payments yet" /> : (
        <ul className="space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="card flex items-center justify-between gap-4 p-5">
              <div><p className="font-semibold">Order #{p.order_number}</p><p className="text-sm capitalize text-muted">{p.provider} · {new Date(p.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p></div>
              <div className="text-right"><p className="font-semibold">{formatNaira(p.amount_kobo)}</p><StatusBadge status={p.status} /></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
