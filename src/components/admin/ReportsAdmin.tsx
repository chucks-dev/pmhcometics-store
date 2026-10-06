"use client";
import { useState } from "react";
import { Input } from "@/components/ui/forms";
import { formatNaira } from "@/lib/money";
import { Loadable, PageHeader, Panel, Stat, Table, useApi } from "./kit";

const day = (d: Date) => d.toISOString().slice(0, 10);

export function ReportsAdmin() {
  const [from, setFrom] = useState(day(new Date(Date.now() - 30 * 864e5))); const [to, setTo] = useState(day(new Date()));
  const qs = `from=${from}&to=${to}`;
  const { data, loading, error, reload } = useApi<any>(`/api/admin/reports?${qs}`);
  return (
    <>
      <PageHeader title="Reports" action={<a className="btn-outline btn-sm" href={`/api/admin/reports?${qs}&format=csv`}>Download orders (CSV)</a>} />
      <div className="mb-4 flex flex-wrap gap-3"><div className="w-44"><Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div className="w-44"><Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></div>
      <Loadable loading={loading && !data} error={error} reload={reload}>
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Stat label="Revenue" value={formatNaira(data.summary.revenueKobo)} /><Stat label="Paid orders" value={data.summary.orders} /><Stat label="Average order" value={formatNaira(data.summary.averageOrderKobo)} /></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Top products"><Table rows={data.topProducts.map((p: any, i: number) => ({ ...p, id: String(i) }))} empty="No sales in this range." columns={[{ header: "Product", cell: (p: any) => p.name }, { header: "Units", cell: (p: any) => p.units }, { header: "Revenue", cell: (p: any) => formatNaira(p.revenueKobo) }]} /></Panel>
              <Panel title="Revenue by category"><Table rows={data.byCategory.map((p: any, i: number) => ({ ...p, id: String(i) }))} empty="No sales in this range." columns={[{ header: "Category", cell: (p: any) => p.name }, { header: "Revenue", cell: (p: any) => formatNaira(p.revenueKobo) }]} /></Panel>
              <Panel title="Payments by provider"><Table rows={data.byProvider.map((p: any) => ({ ...p, id: p.provider }))} empty="No payments." columns={[{ header: "Provider", cell: (p: any) => <span className="capitalize">{p.provider}</span> }, { header: "Payments", cell: (p: any) => p.count }, { header: "Amount", cell: (p: any) => formatNaira(p.amountKobo) }]} /></Panel>
              <Panel title="Orders by status"><Table rows={data.byStatus.map((p: any) => ({ ...p, id: p.status }))} empty="No orders." columns={[{ header: "Status", cell: (p: any) => <span className="capitalize">{p.status.replace(/_/g, " ")}</span> }, { header: "Orders", cell: (p: any) => p.count }]} /></Panel>
            </div>
          </div>
        )}
      </Loadable>
    </>
  );
}
