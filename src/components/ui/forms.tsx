"use client";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { forwardRef, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/api";

type Variant = "primary" | "outline" | "ghost" | "dark";
export const btn = (variant: Variant = "primary", size: "md" | "sm" = "md", extra?: string) =>
  cn(`btn-${variant}`, size === "sm" && "btn-sm", extra);

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "sm"; loading?: boolean }) {
  return (
    <button className={btn(variant, size, className)} disabled={disabled || loading} {...p}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children }:
  { href: string; variant?: Variant; size?: "md" | "sm"; className?: string; children: ReactNode }) {
  return <Link href={href} className={btn(variant, size, className)}>{children}</Link>;
}

interface FieldProps { label?: string; error?: string; hint?: string }

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function Input({ label, error, hint, className, id, ...p }, ref) {
    const uid = useId(); const fid = id ?? uid;
    return (
      <div>
        {label && <label htmlFor={fid} className="label">{label}</label>}
        <input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-e` : undefined}
          className={cn("input", error && "border-red-400", className)} {...p} />
        {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
        {error && <p id={`${fid}-e`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  });

export function PasswordInput({ label = "Password", error, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} className={cn("input pr-12", error && "border-red-400")} aria-invalid={!!error} {...p} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const id = useId();
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <textarea id={id} rows={4} className={cn("input min-h-[110px] py-3", error && "border-red-400", className)} {...p} />
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const id = useId();
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select id={id} className={cn("input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%236B6168%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-10", error && "border-red-400", className)} {...p}>
        {children}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Checkbox({ label, className, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("flex min-h-[44px] cursor-pointer items-start gap-3 py-1.5 text-[15px]", className)}>
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-line accent-brand-500" {...p} />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ label, className, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("flex min-h-[44px] cursor-pointer items-center gap-3 py-1.5 text-[15px]", className)}>
      <input type="radio" className="h-5 w-5 shrink-0 accent-brand-500" {...p} />
      <span>{label}</span>
    </label>
  );
}

/** Tappable chip used for onboarding choices (single or multi select). */
export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={selected} onClick={onClick}
      className={cn("min-h-[48px] rounded-full border px-5 text-[15px] font-medium transition active:scale-[.98]",
        selected ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white hover:border-brand-300")}>
      {children}
    </button>
  );
}
