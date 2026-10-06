"use client";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/ui/display";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Button, ButtonLink, Input, Select } from "@/components/ui/forms";
import { NIGERIAN_STATES } from "@/lib/constants";
import { formatNaira } from "@/lib/money";
import { CartSummary } from "@/components/store/CartSummary";
import { useStore } from "@/components/store/StoreProvider";

export default function CartPage() {
  const { ready, cart, setQty, removeItem, toggleWishlist, wishlist, applyCode, deliveryState, setDeliveryState } = useStore();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="container-x py-8"><Skeleton className="h-10 w-48" /><Skeleton className="mt-6 h-32 w-full" /><Skeleton className="mt-4 h-32 w-full" /></div>;
  if (!cart.items.length) {
    return <div className="container-x"><EmptyState title="Your bag is empty" text="Add something lovely and it will show up here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} /></div>;
  }
  const blocked = cart.items.some((i) => !i.available);

  return (
    <div className="container-x py-8">
      <h1 className="text-4xl sm:text-5xl">Your bag</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-4">
          {cart.items.map((i) => (
            <li key={i.productId} className="card flex gap-4 p-3 sm:p-4">
              <Link href={`/product/${i.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-28"><ProductImage src={i.image} alt={i.name} /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">{i.brand && <p className="text-xs text-muted">{i.brand}</p>}<Link href={`/product/${i.slug}`} className="line-clamp-2 font-medium">{i.name}</Link></div>
                  <p className="font-semibold">{formatNaira(i.lineKobo)}</p>
                </div>
                <p className="text-sm text-muted">{formatNaira(i.unitKobo)} each</p>
                {!i.available && <p role="alert" className="mt-1 text-sm text-red-600">{i.stock > 0 ? `Only ${i.stock} left. Reduce the quantity.` : "Out of stock. Remove to continue."}</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex h-11 items-center rounded-full border border-line" role="group" aria-label={`Quantity of ${i.name}`}>
                    <button aria-label="Decrease quantity" disabled={i.quantity <= 1} onClick={() => setQty(i.productId, i.quantity - 1)} className="flex h-11 w-11 items-center justify-center disabled:opacity-40"><Minus className="h-4 w-4" /></button>
                    <span className="w-7 text-center font-semibold">{i.quantity}</span>
                    <button aria-label="Increase quantity" disabled={i.quantity >= Math.min(i.stock, 20)} onClick={() => setQty(i.productId, i.quantity + 1)} className="flex h-11 w-11 items-center justify-center disabled:opacity-40"><Plus className="h-4 w-4" /></button>
                  </div>
                  <div className="flex">
                    <button aria-label="Save to wishlist" aria-pressed={wishlist.has(i.productId)} onClick={() => toggleWishlist(i.productId)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush"><Heart className={`h-5 w-5 ${wishlist.has(i.productId) ? "fill-brand-500 text-brand-500" : ""}`} /></button>
                    <button aria-label={`Remove ${i.name}`} onClick={() => removeItem(i.productId)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl">Order summary</h2>
          <Select label="Deliver to" value={deliveryState} onChange={(e) => setDeliveryState(e.target.value)}>
            {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!code.trim()) return; setBusy(true); await applyCode(code.trim().toUpperCase()); setBusy(false); }}>
            <div className="flex-1"><Input placeholder="Discount code" aria-label="Discount code" value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <Button variant="outline" loading={busy}>Apply</Button>
          </form>
          {cart.discountError && <p role="alert" className="-mt-3 text-sm text-red-600">{cart.discountError}</p>}
          {cart.discountCode && <button className="-mt-3 text-sm text-brand-600 underline" onClick={() => { setCode(""); applyCode(null); }}>Remove code {cart.discountCode}</button>}
          {cart.freeDeliveryRemainingKobo > 0 && <p className="rounded-2xl bg-blush px-4 py-2.5 text-sm">Add {formatNaira(cart.freeDeliveryRemainingKobo)} more for free delivery.</p>}
          <CartSummary />
          <ButtonLink href={blocked ? "#" : "/checkout"} className={`w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>Proceed to checkout</ButtonLink>
        </aside>
      </div>
    </div>
  );
}
