"use client";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/display";
import { formatNaira } from "@/lib/money";
import { BarChart, LineChart, Loadable, PageHeader, Panel, Stat, Table, useApi } from "./kit";

interface Data {
  stats: { totalSalesKobo: number; totalOrders: number; customers: number; products: number; pendingOrders: number; lowStock: number; successfulPayments: number; failedPayments: number };
  daily: { day: string; salesKobo: number; orders: number; customers: number }[];
  recentOrders: { id: string; orderNumber: string; customerName: string; totalKobo: number; status: string; createdAt: string }[];
}

export function Dashboard() {
  const { data, loading, error, reload } = useApi<Data>("/api/admin/dashboard");
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Last 30 days at a glance." />
      <Loadable loading={loading} error={error} reload={reload}>
        {data && (() => {
          const s = data.stats; const labels = data.daily.map((d) => d.day.slice(5));
          let run = 0; const cumulative = data.daily.map((d) => (run += d.salesKobo));
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Total sales" value={formatNaira(s.totalSalesKobo)} />
                <Stat label="Total orders" value={s.totalOrders} />
                <Stat label="Total customers" value={s.customers} />
                <Stat label="Total products" value={s.products} />
                <Stat label="Pending orders" value={s.pendingOrders} tone={s.pendingOrders ? "warn" : undefined} />
                <Stat label="Low stock products" value={s.lowStock} tone={s.lowStock ? "warn" : undefined} />
                <Stat label="Successful payments" value={s.successfulPayments} />
                <Stat label="Failed payments" value={s.failedPayments} tone={s.failedPayments ? "bad" : undefined} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Sales (daily)"><LineChart values={data.daily.map((d) => d.salesKobo)} labels={labels} format={formatNaira} /></Panel>
                <Panel title="Orders (daily)"><BarChart values={data.daily.map((d) => d.orders)} labels={labels} format={String} /></Panel>
                <Panel title="New customers (daily)"><BarChart values={data.daily.map((d) => d.customers)} labels={labels} format={String} color="#951556" /></Panel>
                <Panel title="Revenue (cumulative)"><LineChart values={cumulative} labels={labels} format={formatNaira} color="#951556" /></Panel>
              </div>
              <Panel title="Recent orders">
                <Table rows={data.recentOrders} empty="No paid orders yet." columns={[
                  { header: "Order", cell: (o) => <Link href={`/orders/${o.id}`} className="font-semibold text-brand-600">#{o.orderNumber}</Link> },
                  { header: "Customer", cell: (o) => o.customerName },
                  { header: "Total", cell: (o) => formatNaira(o.totalKobo) },
                  { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
                  { header: "Date", cell: (o) => new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) },
                ]} />
              </Panel>
            </div>
          );
        })()}
      </Loadable>
    </>
  );
}
