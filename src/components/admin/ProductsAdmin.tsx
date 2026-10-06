"use client";
import Link from "next/link";
import { useState } from "react";
import { ProductImage, StatusBadge } from "@/components/ui/display";
import { useToast } from "@/components/ui/feedback";
import { Button, ButtonLink, Input, Select } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import { stockStatus } from "@/lib/stock";
import { Loadable, PageHeader, Pager, Panel, Table, useApi } from "./kit";

interface Row { id: string; name: string; sku: string; brand: string | null; priceKobo: string; discountPriceKobo: string | null; stock: number; lowStockThreshold: number; status: string; category: string; image: string | null }

export function ProductsAdmin() {
  const toast = useToast();
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{ items: Row[]; total: number }>(`/api/admin/products?page=${page}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}`);
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast(msg); reload(); } catch (e) { toast(e instanceof ApiError ? e.message : "Failed", "error"); } };
  return (
    <>
      <PageHeader title="Products" action={<ButtonLink href="/products/new" size="sm">Add product</ButtonLink>} />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1"><Input placeholder="Search name or SKU" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search products" /></div>
          <div className="w-40"><Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></Select></div>
        </div>
        <Loadable loading={loading && !data} error={error} reload={reload}>
          <Table rows={data?.items ?? []} empty="No products match." columns={[
            { header: "Product", cell: (p) => <div className="flex items-center gap-3"><div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl"><ProductImage src={p.image} alt="" /></div><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.sku}{p.brand ? ` · ${p.brand}` : ""}</p></div></div> },
            { header: "Category", cell: (p) => p.category },
            { header: "Price", cell: (p) => p.discountPriceKobo ? <span>{formatNaira(p.discountPriceKobo)} <s className="text-muted">{formatNaira(p.priceKobo)}</s></span> : formatNaira(p.priceKobo) },
            { header: "Stock", cell: (p) => <span className="flex items-center gap-2">{p.stock} <StatusBadge status={stockStatus(p.stock, p.lowStockThreshold)} /></span> },
            { header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
            { header: "", className: "text-right whitespace-nowrap", cell: (p) => (
              <div className="flex justify-end gap-1">
                <Link href={`/products/${p.id}`} className="btn-ghost btn-sm">Edit</Link>
                <Button size="sm" variant="ghost" onClick={() => act(() => api(`/api/admin/products/${p.id}`, { method: "PATCH", body: { status: p.status === "published" ? "draft" : "published" } }), p.status === "published" ? "Unpublished" : "Published")}>{p.status === "published" ? "Unpublish" : "Publish"}</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${p.name}"? Past orders keep their records.`)) act(() => api(`/api/admin/products/${p.id}`, { method: "DELETE" }), "Deleted"); }}>Delete</Button>
              </div>) },
          ]} />
          <Pager page={page} total={data?.total ?? 0} pageSize={20} onChange={setPage} />
        </Loadable>
      </Panel>
    </>
  );
}
