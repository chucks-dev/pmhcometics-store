"use client";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/api";

export type PaymentProvider = "paystack" | "flutterwave";
const OPTIONS: { id: PaymentProvider; name: string; note: string }[] = [
  { id: "paystack", name: "Paystack", note: "Card, bank transfer, USSD" },
  { id: "flutterwave", name: "Flutterwave", note: "Card, bank transfer, mobile money" },
];

export function PaymentSelector({ value, onChange }: { value: PaymentProvider | null; onChange: (p: PaymentProvider) => void }) {
  return (
    <div role="radiogroup" aria-label="Payment provider" className="grid gap-3">
      {OPTIONS.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={cn("flex min-h-[72px] items-center gap-4 rounded-2xl border p-4 text-left transition",
            value === o.id ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line bg-white hover:border-brand-300")}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush text-brand-600"><CreditCard className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-semibold">{o.name}</span><span className="text-sm text-muted">{o.note}</span></span>
          <span className={cn("h-5 w-5 rounded-full border-2", value === o.id ? "border-brand-500 bg-brand-500 shadow-[inset_0_0_0_3px_white]" : "border-line")} />
        </button>
      ))}
    </div>
  );
}
