"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Skeleton, ErrorState } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { cn } from "@/lib/api";

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>(""); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!url) return; setLoading(true); setError("");
    try { setData(await api<T>(url)); } catch (e: any) { setError(e.message ?? "Failed to load"); }
    setLoading(false);
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-muted">{subtitle}</p>}</div>{action}
  </div>
);

export const Panel = ({ title, children, className }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={cn("card p-5", className)}>{title && <h2 className="mb-4 font-sans text-base font-semibold">{title}</h2>}{children}</section>
);

export const Stat = ({ label, value, tone }: { label: string; value: string | number; tone?: "warn" | "bad" }) => (
  <div className="card p-4">
    <p className="text-sm text-muted">{label}</p>
    <p className={cn("mt-1 font-display text-3xl", tone === "warn" && "text-amber-600", tone === "bad" && "text-red-600")}>{value}</p>
  </div>
);

export interface Column<T> { header: string; cell: (row: T) => ReactNode; className?: string }
export function Table<T extends { id?: string }>({ columns, rows, empty = "Nothing here yet." }: { columns: Column<T>[]; rows: T[]; empty?: string }) {
  if (!rows.length) return <p className="py-10 text-center text-muted">{empty}</p>;
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b border-line text-muted">{columns.map((c) => <th key={c.header} className={cn("whitespace-nowrap py-2.5 pr-4 font-medium", c.className)}>{c.header}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id ?? i} className="border-b border-line/70 last:border-0">{columns.map((c) => <td key={c.header} className={cn("py-3 pr-4 align-middle", c.className)}>{c.cell(r)}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted">Page {page} of {pages} · {total} total</span>
      <div className="flex gap-2">
        <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Loadable({ loading, error, reload, children }: { loading: boolean; error: string; reload: () => void; children: ReactNode }) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return <>{children}</>;
}

// ───── tiny dependency-free SVG charts ─────
export function LineChart({ values, labels, format, color = "#D6247C" }: { values: number[]; labels: string[]; format: (n: number) => string; color?: string }) {
  const W = 600, H = 160, P = 6;
  const max = Math.max(...values, 1);
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(values.length - 1, 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label={`Trend from ${labels[0]} to ${labels[labels.length - 1]}, peak ${format(max)}`}>
        <polygon points={`${P},${H - P} ${pts} ${W - P},${H - P}`} fill={color} opacity="0.1" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted"><span>{labels[0]}</span><span>Peak {format(max)}</span><span>{labels[labels.length - 1]}</span></figcaption>
    </figure>
  );
}

export function BarChart({ values, labels, format, color = "#D6247C" }: { values: number[]; labels: string[]; format: (n: number) => string; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <figure>
      <div className="flex h-40 items-end gap-[3px]" role="img" aria-label={`Bar chart from ${labels[0]} to ${labels[labels.length - 1]}, peak ${format(max)}`}>
        {values.map((v, i) => <div key={i} title={`${labels[i]}: ${format(v)}`} className="flex-1 rounded-t" style={{ height: `${Math.max((v / max) * 100, v > 0 ? 3 : 0.5)}%`, background: color, opacity: v ? 0.85 : 0.2 }} />)}
      </div>
      <figcaption className="mt-1 flex justify-between text-xs text-muted"><span>{labels[0]}</span><span>Peak {format(max)}</span><span>{labels[labels.length - 1]}</span></figcaption>
    </figure>
  );
}
