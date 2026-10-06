"use client";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/display";
import { useToast } from "@/components/ui/feedback";
import { Button, Input, Select } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import { Loadable, PageHeader, Pager, Panel, Table, useApi } from "./kit";

export function CustomersAdmin() {
  const toast = useToast();
  const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; total: number }>(`/api/admin/customers?page=${page}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  return (
    <>
      <PageHeader title="Customers" />
      <Panel>
        <div className="mb-4 max-w-sm"><Input placeholder="Search name, email or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search customers" /></div>
        <Loadable loading={loading && !data} error={error} reload={reload}>
          <Table rows={data?.items ?? []} columns={[
            { header: "Customer", cell: (c) => <div><p className="font-medium">{c.fullName}</p><p className="text-xs text-muted">{c.email}{!c.verified && " · unverified"}</p></div> },
            { header: "Phone", cell: (c) => c.phone ?? "n/a" },
            { header: "Joined", cell: (c) => new Date(c.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) },
            { header: "Orders", cell: (c) => c.orderCount }, { header: "Total spent", cell: (c) => formatNaira(c.totalSpentKobo) },
            { header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
            { header: "", className: "text-right", cell: (c) => <Button size="sm" variant="ghost" onClick={async () => {
              const to = c.status === "active" ? "suspended" : "active";
              if (to === "suspended" && !confirm(`Suspend ${c.fullName}? They'll be signed out and unable to log in.`)) return;
              try { await api(`/api/admin/customers/${c.id}`, { method: "PATCH", body: { status: to } }); toast(to === "active" ? "Account reactivated" : "Account suspended"); reload(); } catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); }
            }}>{c.status === "active" ? "Suspend" : "Reactivate"}</Button> },
          ]} />
          <Pager page={page} total={data?.total ?? 0} pageSize={20} onChange={setPage} />
        </Loadable>
      </Panel>
    </>
  );
}

export function PaymentsAdmin() {
  const [q, setQ] = useState(""); const [provider, setProvider] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: any[]; total: number }>(`/api/admin/payments?page=${page}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ""}${provider ? `&provider=${provider}` : ""}${status ? `&status=${status}` : ""}`);
  return (
    <>
      <PageHeader title="Payments" />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1"><Input placeholder="Search reference, order or customer" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search payments" /></div>
          <div className="w-40"><Select aria-label="Provider" value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1); }}><option value="">All providers</option><option value="paystack">Paystack</option><option value="flutterwave">Flutterwave</option></Select></div>
          <div className="w-40"><Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="pending">Pending</option><option value="successful">Successful</option><option value="failed">Failed</option><option value="refunded">Refunded</option></Select></div>
        </div>
        <Loadable loading={loading && !data} error={error} reload={reload}>
          <Table rows={data?.items ?? []} columns={[
            { header: "Transaction ID", cell: (p) => <span className="font-mono text-xs">{p.transactionId}</span> },
            { header: "Order", cell: (p) => `#${p.orderNumber}` }, { header: "Customer", cell: (p) => p.customer },
            { header: "Provider", cell: (p) => <span className="capitalize">{p.provider}</span> }, { header: "Amount", cell: (p) => formatNaira(p.amountKobo) },
            { header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
            { header: "Date", cell: (p) => new Date(p.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) },
          ]} />
          <Pager page={page} total={data?.total ?? 0} pageSize={20} onChange={setPage} />
        </Loadable>
      </Panel>
    </>
  );
}
