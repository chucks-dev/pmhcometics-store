"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { CartDTO } from "@/types/catalog";
import { useToast } from "@/components/ui/feedback";

interface SessionUser { id: string; fullName: string; email: string; phone: string | null }
const EMPTY_CART: CartDTO = { items: [], count: 0, subtotalKobo: 0, deliveryKobo: 0, discountKobo: 0, totalKobo: 0, discountCode: null, discountError: null, freeDeliveryRemainingKobo: 0 };

interface StoreCtx {
  ready: boolean; user: SessionUser | null; cart: CartDTO; wishlist: Set<string>;
  deliveryState: string; setDeliveryState: (s: string) => void;
  addToCart: (productId: string, qty?: number) => Promise<boolean>;
  setQty: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  applyCode: (code: string | null) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  logout: () => Promise<void>;
}
const Ctx = createContext<StoreCtx | null>(null);
export const useStore = () => { const c = useContext(Ctx); if (!c) throw new Error("useStore outside StoreProvider"); return c; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cart, setCart] = useState<CartDTO>(EMPTY_CART);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [code, setCode] = useState<string | null>(null);
  const [deliveryState, setDeliveryStateRaw] = useState("Lagos");

  const fetchCart = useCallback(async (c: string | null, s: string) => {
    const q = new URLSearchParams({ state: s }); if (c) q.set("code", c);
    setCart(await api<CartDTO>(`/api/cart?${q}`));
  }, []);

  useEffect(() => {
    const savedCode = sessionStorage.getItem("cos_code"); const savedState = sessionStorage.getItem("cos_state") || "Lagos";
    setCode(savedCode); setDeliveryStateRaw(savedState);
    (async () => {
      try {
        const me = await api<{ user: SessionUser | null }>("/api/auth/me");
        setUser(me.user);
        await fetchCart(savedCode, savedState);
        if (me.user) setWishlist(new Set((await api<{ ids: string[] }>("/api/wishlist?ids=1")).ids));
      } catch { /* offline: leave defaults */ }
      setReady(true);
    })();
  }, [fetchCart]);

  const refreshCart = useCallback(() => fetchCart(code, deliveryState), [fetchCart, code, deliveryState]);

  const fail = (e: unknown) => toast(e instanceof ApiError ? e.message : "Something went wrong. Please try again.", "error");

  const value = useMemo<StoreCtx>(() => ({
    ready, user, cart, wishlist, deliveryState,
    setDeliveryState: (s) => { setDeliveryStateRaw(s); sessionStorage.setItem("cos_state", s); fetchCart(code, s).catch(() => {}); },
    async addToCart(productId, qty = 1) {
      try {
        const r = await api<{ cart: CartDTO; capped: boolean }>("/api/cart/items", { body: { productId, quantity: qty } });
        await fetchCart(code, deliveryState);
        toast(r.capped ? "Added. That's all we have in stock." : "Added to your bag");
        return true;
      } catch (e) { fail(e); return false; }
    },
    async setQty(productId, qty) {
      try { await api(`/api/cart/items/${productId}`, { method: "PATCH", body: { quantity: qty } }); await fetchCart(code, deliveryState); } catch (e) { fail(e); }
    },
    async removeItem(productId) {
      try { await api(`/api/cart/items/${productId}`, { method: "DELETE" }); await fetchCart(code, deliveryState); toast("Removed from your bag"); } catch (e) { fail(e); }
    },
    async applyCode(c) {
      setCode(c);
      if (c) sessionStorage.setItem("cos_code", c); else sessionStorage.removeItem("cos_code");
      await fetchCart(c, deliveryState);
    },
    async toggleWishlist(productId) {
      if (!user) {
        toast("Log in to save favourites", "info");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const has = wishlist.has(productId);
      setWishlist((w) => { const n = new Set(w); has ? n.delete(productId) : n.add(productId); return n; }); // optimistic
      try {
        if (has) await api(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
        else await api("/api/wishlist", { body: { productId } });
        toast(has ? "Removed from wishlist" : "Saved to wishlist");
        router.refresh();
      } catch (e) {
        setWishlist((w) => { const n = new Set(w); has ? n.add(productId) : n.delete(productId); return n; });
        fail(e);
      }
    },
    refreshCart,
    async logout() {
      await api("/api/auth/logout", { method: "POST", body: {} }).catch(() => {});
      setUser(null); setWishlist(new Set()); setCart(EMPTY_CART);
      router.push("/"); router.refresh();
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [ready, user, cart, wishlist, deliveryState, code, fetchCart, refreshCart]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
