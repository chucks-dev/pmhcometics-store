import Link from "next/link";
import { Check, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/api";
import { ORDER_STEPS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatNaira } from "@/lib/money";

export function Rating({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const px = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1.5" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <div className="flex">{[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(px, n <= Math.round(value) ? "fill-brand-400 text-brand-400" : "fill-line text-line")} />
      ))}</div>
      {count !== undefined && <span className="text-xs text-muted">({count})</span>}
    </div>
  );
}

export function Price({ current, original, size = "md" }: { current: number; original?: number | null; size?: "md" | "lg" }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("font-semibold", size === "lg" ? "text-2xl" : "text-base")}>{formatNaira(current)}</span>
      {original ? <span className="text-sm text-muted line-through">{formatNaira(original)}</span> : null}
    </div>
  );
}

/** Product photo, or a soft placeholder when none has been uploaded yet. */
export function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  return (
    <div role="img" aria-label={alt} className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 via-blush to-brand-100", className)}>
      <Sparkles className="h-8 w-8 text-brand-300" aria-hidden />
    </div>
  );
}

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    sp.set("page", String(p));
    return `${basePath}?${sp}`;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && <Link href={href(page - 1)} className="btn-outline btn-sm">Previous</Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && nums[i - 1] !== n - 1 && <span className="text-muted">…</span>}
          <Link href={href(n)} aria-current={n === page ? "page" : undefined}
            className={cn("flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium", n === page ? "bg-brand-500 text-white" : "hover:bg-blush")}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} className="btn-outline btn-sm">Next</Link>}
    </nav>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === active} onClick={() => onChange(t.id)}
          className={cn("-mb-px min-h-[48px] shrink-0 border-b-2 px-4 text-[15px] font-medium transition",
            t.id === active ? "border-brand-500 text-brand-700" : "border-transparent text-muted hover:text-ink")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone =
    ["delivered", "successful", "approved", "active", "published", "in"].includes(status) ? "bg-emerald-50 text-emerald-700"
    : ["cancelled", "failed", "hidden", "suspended", "out", "refunded"].includes(status) ? "bg-red-50 text-red-700"
    : ["pending", "pending_payment", "draft", "low", "payment_confirmed"].includes(status) ? "bg-amber-50 text-amber-700"
    : "bg-blush text-brand-700";
  const label = ORDER_STATUS_LABEL[status] ?? ({ in: "In stock", low: "Low stock", out: "Out of stock" } as Record<string, string>)[status] ?? status.replace(/_/g, " ");
  return <span className={cn("badge capitalize", tone, className)}>{label}</span>;
}

/** Order tracking stepper. `history` timestamps are shown against reached steps. */
export function OrderStatus({ status, history = [] }: { status: string; history?: { status: string; at: string }[] }) {
  if (status === "cancelled" || status === "refunded") {
    return <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">This order was {status}.</div>;
  }
  const idx = status === "pending_payment" ? -1 : ORDER_STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="space-y-0">
      {ORDER_STEPS.map((s, i) => {
        const done = i <= idx; const at = history.find((h) => h.status === s.status)?.at;
        return (
          <li key={s.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2", done ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white")}>
                {done && <Check className="h-4 w-4" />}
              </span>
              {i < ORDER_STEPS.length - 1 && <span className={cn("w-0.5 flex-1 min-h-6", i < idx ? "bg-brand-500" : "bg-line")} />}
            </div>
            <div className="pb-5">
              <p className={cn("font-medium", !done && "text-muted")}>{s.label}</p>
              {at && <p className="text-xs text-muted">{new Date(at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export const SectionTitle = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="mb-5 flex items-end justify-between gap-4">
    <h2 className="text-2xl sm:text-3xl">{title}</h2>
    {action}
  </div>
);
