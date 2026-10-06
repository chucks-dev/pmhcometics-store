"use client";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge, OrderStatus } from "@/components/ui/display";
import { Alert, useToast } from "@/components/ui/feedback";
import { Button, Input, Select } from "@/components/ui/forms";
import { api, ApiError, cn } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import type { OrderDetail } from "@/server/orders";
import { Loadable, PageHeader, Pager, Panel, Table, useApi } from "./kit";

const TABS = [["", "All"], ["pending", "Pending"], ["processing", "Processing"], ["shipped", "Shipped"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"], ["cancelled", "Cancelled"], ["refunded", "Refunded"]];

export function OrdersAdmin() {
  const [status, setStatus] = useState(""); const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; total: number }>(`/api/admin/orders?page=${page}&pageSize=20${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  return (
    <>
      <PageHeader title="Orders" subtitle="Only paid orders appear here." />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {TABS.map(([v, l]) => <button key={v} onClick={() => { setStatus(v); setPage(1); }} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium", status === v ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white")}>{l}</button>)}
      </div>
      <Panel>
        <div className="mb-4 max-w-sm"><Input placeholder="Search order #, name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search orders" /></div>
        <Loadable loading={loading && !data} error={error} reload={reload}>
          <Table rows={data?.items ?? []} empty="No orders in this view." columns={[
            { header: "Order", cell: (o) => <Link href={`/orders/${o.id}`} className="font-semibold text-brand-600">#{o.orderNumber}</Link> },
            { header: "Customer", cell: (o) => <div><p>{o.customerName}</p><p className="text-xs text-muted">{o.customerEmail}</p></div> },
            { header: "Items", cell: (o) => o.itemCount }, { header: "Total", cell: (o) => formatNaira(o.totalKobo) },
            { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
            { header: "Date", cell: (o) => new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) },
          ]} />
          <Pager page={page} total={data?.total ?? 0} pageSize={20} onChange={setPage} />
        </Loadable>
      </Panel>
    </>
  );
}

const NEXT: Record<string, { v: string; l: string }[]> = {
  payment_confirmed: [{ v: "processing", l: "Processing" }, { v: "shipped", l: "Shipped" }, { v: "cancelled", l: "Cancelled" }, { v: "refunded", l: "Refunded" }],
  processing: [{ v: "shipped", l: "Shipped" }, { v: "cancelled", l: "Cancelled" }, { v: "refunded", l: "Refunded" }],
  shipped: [{ v: "out_for_delivery", l: "Out for delivery" }, { v: "delivered", l: "Delivered" }, { v: "refunded", l: "Refunded" }],
  out_for_delivery: [{ v: "delivered", l: "Delivered" }, { v: "refunded", l: "Refunded" }],
  delivered: [{ v: "refunded", l: "Refunded" }],
};

export function OrderAdminDetail({ id }: { id: string }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<{ order: OrderDetail }>(`/api/admin/orders/${id}`);
  const [next, setNext] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const o = data?.order;
  const options = o ? NEXT[o.status] ?? [] : [];
  return (
    <>
      <PageHeader title={o ? `Order #${o.orderNumber}` : "Order"} action={<Link href="/orders" className="btn-outline btn-sm">All orders</Link>} />
      <Loadable loading={loading} error={error} reload={reload}>
        {o && (
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <Panel title="Items">
                <Table rows={o.items.map((i, n) => ({ ...i, id: String(n) }))} columns={[
                  { header: "Product", cell: (i) => <div><p className="font-medium">{i.name}</p><p className="text-xs text-muted">{i.sku}</p></div> },
                  { header: "Price", cell: (i) => formatNaira(i.unitKobo) }, { header: "Qty", cell: (i) => i.quantity }, { header: "Total", cell: (i) => formatNaira(i.lineKobo) },
                ]} />
                <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNaira(o.subtotalKobo)}</dd></div>
                  <div className="flex justify-between"><dt>Delivery</dt><dd>{formatNaira(o.deliveryKobo)}</dd></div>
                  {o.discountKobo > 0 && <div className="flex justify-between"><dt>Discount {o.discountCode}</dt><dd>-{formatNaira(o.discountKobo)}</dd></div>}
                  <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatNaira(o.totalKobo)}</dd></div>
                </dl>
              </Panel>
              <Panel title="Customer & delivery">
                <p>{o.customerName}</p><p className="text-muted">{o.customerEmail} · {o.customerPhone}</p>
                <p className="mt-3 text-muted">{o.address.street}, {o.address.city}, {o.address.state}{o.address.info ? ` (${o.address.info})` : ""}</p>
              </Panel>
            </div>
            <div className="space-y-4">
              <Panel title="Status">
                <div className="mb-3 flex gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} /></div>
                <p className="mb-4 text-sm text-muted">Paid with {o.provider ?? "n/a"}</p>
                {options.length > 0 ? (
                  <div className="space-y-3">
                    <Select label="Move order to" value={next} onChange={(e) => setNext(e.target.value)}><option value="">Choose a status…</option>{options.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</Select>
                    <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                    {(next === "cancelled" || next === "refunded") && <Alert kind="info">Stock returns to inventory. Refunds must also be issued from your Paystack/Flutterwave dashboard.</Alert>}
                    {err && <Alert>{err}</Alert>}
                    <Button className="w-full" disabled={!next} loading={busy} onClick={async () => {
                      setBusy(true); setErr("");
                      try { await api(`/api/admin/orders/${id}`, { method: "PATCH", body: { status: next, note: note || undefined } }); toast("Order updated"); setNext(""); setNote(""); reload(); }
                      catch (e) { setErr(e instanceof ApiError ? e.message : "Failed"); }
                      setBusy(false);
                    }}>Update status</Button>
                  </div>
                ) : <p className="text-sm text-muted">No further changes available.</p>}
              </Panel>
              <Panel title="Progress"><OrderStatus status={o.status} history={o.history} /></Panel>
            </div>
          </div>
        )}
      </Loadable>
    </>
  );
}
