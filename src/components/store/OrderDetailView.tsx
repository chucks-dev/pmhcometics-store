import { StatusBadge } from "@/components/ui/display";
import { formatNaira } from "@/lib/money";
import type { OrderDetail } from "@/server/orders";

export function OrderDetailView({ order }: { order: OrderDetail }) {
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-sans text-lg font-semibold">Order #{order.orderNumber}</h3>
          <div className="flex gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></div>
        </div>
        <p className="mt-1 text-sm text-muted">Placed {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}{order.provider ? ` · Paid with ${order.provider}` : ""}</p>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.productId + i.name} className="flex justify-between gap-4 py-3 text-[15px]">
              <span>{i.name} <span className="text-muted">× {i.quantity}</span></span><span className="font-medium">{formatNaira(i.lineKobo)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNaira(order.subtotalKobo)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{order.deliveryKobo ? formatNaira(order.deliveryKobo) : "Free"}</dd></div>
          {order.discountKobo > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.discountCode && `(${order.discountCode})`}</dt><dd>-{formatNaira(order.discountKobo)}</dd></div>}
          <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd>{formatNaira(order.totalKobo)}</dd></div>
        </dl>
      </div>
      <div className="card p-5">
        <h3 className="font-sans text-lg font-semibold">Delivery address</h3>
        <p className="mt-2 text-muted">{order.customerName}<br />{order.address.street}, {order.address.city}, {order.address.state}{order.address.info && <><br />{order.address.info}</>}<br />{order.customerPhone}</p>
      </div>
    </div>
  );
}
