"use client";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/api";

// ───── Toast ─────
type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; message: string; kind: ToastKind }
const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = next.current++;
    setItems((x) => [...x.slice(-2), { id, message, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        {items.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto flex max-w-sm animate-slideUp items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-lift">
            {t.kind === "error" ? <AlertCircle className="h-4 w-4 shrink-0 text-brand-300" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-300" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ───── Modal / bottom sheet ─────
export function Modal({ open, onClose, title, children, sheet }: { open: boolean; onClose: () => void; title: string; children: ReactNode; sheet?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={cn("relative flex max-h-[88vh] w-full animate-slideUp flex-col bg-white shadow-lift sm:max-w-lg",
        sheet ? "rounded-t-3xl sm:rounded-3xl" : "m-4 rounded-3xl")}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-blush"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ───── Loading / empty / error ─────
export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton", className)} aria-hidden />;

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/3" /></div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
      <div className="mb-5 h-20 w-16 rounded-t-full bg-gradient-to-b from-brand-100 to-blush" aria-hidden />
      <h2 className="text-2xl">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "We couldn't load this right now.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-sm flex-col items-center py-12 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-brand-500" />
      <p className="text-muted">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline btn-sm mt-4">Try again</button>}
    </div>
  );
}

export const Alert = ({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) => (
  <div role={kind === "error" ? "alert" : "status"} className={cn("rounded-2xl px-4 py-3 text-sm",
    kind === "error" && "bg-red-50 text-red-700", kind === "success" && "bg-emerald-50 text-emerald-800", kind === "info" && "bg-blush text-brand-800")}>
    {children}
  </div>
);
