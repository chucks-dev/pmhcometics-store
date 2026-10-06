"use client";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/api";
import { useStore } from "./StoreProvider";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const [pop, setPop] = useState(false);
  const on = wishlist.has(productId);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPop(true); setTimeout(() => setPop(false), 400); toggleWishlist(productId); }}
      className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-soft transition hover:bg-white", className)}>
      <Heart className={cn("h-5 w-5 transition", on ? "fill-brand-500 text-brand-500" : "text-ink", pop && "animate-pop")} />
    </button>
  );
}

export function CartButton({ className }: { className?: string }) {
  const { cart } = useStore();
  return (
    <Link href="/cart" aria-label={`Bag, ${cart.count} items`} className={cn("relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush", className)}>
      <ShoppingBag className="h-[22px] w-[22px]" />
      {cart.count > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{cart.count}</span>}
    </Link>
  );
}

export function AddToCartButton({ productId, disabled, className, label = "Add to cart" }: { productId: string; disabled?: boolean; className?: string; label?: string }) {
  const { addToCart } = useStore();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  return (
    <button type="button" disabled={disabled || state === "busy"} className={cn("btn-primary w-full", className)}
      onClick={async (e) => {
        e.preventDefault(); setState("busy");
        const ok = await addToCart(productId, 1);
        setState(ok ? "done" : "idle"); if (ok) setTimeout(() => setState("idle"), 1200);
      }}>
      {disabled ? "Out of stock" : state === "done" ? "Added ✓" : state === "busy" ? "Adding…" : label}
    </button>
  );
}
