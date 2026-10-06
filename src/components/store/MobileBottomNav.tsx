"use client";
import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/api";
import { useStore } from "./StoreProvider";

export function MobileBottomNav() {
  const path = usePathname();
  const { cart, wishlist, user } = useStore();
  if (path.startsWith("/checkout") || path.startsWith("/payment")) return null;
  const items = [
    { href: "/", label: "Home", Icon: Home, badge: 0, active: path === "/" },
    { href: "/shop", label: "Shop", Icon: Store, badge: 0, active: path.startsWith("/shop") || path.startsWith("/category") || path.startsWith("/product") || path.startsWith("/search") },
    { href: "/wishlist", label: "Wishlist", Icon: Heart, badge: wishlist.size, active: path.startsWith("/wishlist") },
    { href: "/cart", label: "Cart", Icon: ShoppingBag, badge: cart.count, active: path.startsWith("/cart") },
    { href: user ? "/account" : "/login", label: "Account", Icon: User, badge: 0, active: path.startsWith("/account") || path === "/login" || path === "/signup" },
  ];
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, Icon, badge, active }) => (
          <li key={label}>
            <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-brand-600" : "text-muted")}>
              <span className="relative">
                <Icon className={cn("h-6 w-6", active && "fill-brand-100")} />
                {badge > 0 && <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{badge}</span>}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
