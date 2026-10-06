"use client";
import { formatNaira } from "@/lib/money";
import { useStore } from "./StoreProvider";

export function CartSummary({ cta }: { cta?: React.ReactNode }) {
  const { cart } = useStore();
  const row = (l: string, v: string, strong?: boolean, green?: boolean) => (
    <div className={`flex justify-between ${strong ? "text-lg font-semibold" : ""} ${green ? "text-emerald-700" : ""}`}><dt>{l}</dt><dd>{v}</dd></div>
  );
  return (
    <dl className="space-y-3 text-[15px]">
      {row("Subtotal", formatNaira(cart.subtotalKobo))}
      {row("Delivery", cart.deliveryKobo === 0 ? "Free" : formatNaira(cart.deliveryKobo), false, cart.deliveryKobo === 0)}
      {cart.discountKobo > 0 && row(`Discount${cart.discountCode ? ` (${cart.discountCode})` : ""}`, `-${formatNaira(cart.discountKobo)}`, false, true)}
      <div className="border-t border-line pt-3">{row("Total", formatNaira(cart.totalKobo), true)}</div>
      {cta}
    </dl>
  );
}
