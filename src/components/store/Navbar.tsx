"use client";
import { ChevronDown, Heart, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/api";
import { CartButton } from "./buttons";
import { SearchBar } from "./SearchBar";
import { useStore } from "./StoreProvider";

export function Logo({ className }: { className?: string }) {
  return <Link href="/" className={cn("font-display text-[26px] leading-none tracking-tight text-brand-700", className)}>PMHCOSMETICS</Link>;
}

export function Navbar({ categories }: { categories: { name: string; slug: string }[] }) {
  const { user, wishlist, logout } = useStore();
  const path = usePathname();
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const link = (href: string, label: string) => (
    <Link href={href} className={cn("rounded-full px-4 py-2 text-[15px] font-medium hover:bg-blush", path === href && "text-brand-600")}>{label}</Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {link("/", "Home")}{link("/shop", "Shop")}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-medium hover:bg-blush" aria-haspopup="true">Categories <ChevronDown className="h-4 w-4" /></button>
            <div className="invisible absolute left-0 top-full w-56 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="card p-2">
                {categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className="block rounded-xl px-4 py-2.5 hover:bg-blush">{c.name}</Link></li>)}
                <li><Link href="/category/new-arrivals" className="block rounded-xl px-4 py-2.5 hover:bg-blush">New Arrivals</Link></li>
              </ul>
            </div>
          </div>
          {link("/about", "About")}{link("/contact", "Contact")}
        </nav>
        <div className="flex items-center">
          <button onClick={() => setSearch(true)} aria-label="Search" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush"><Search className="h-[22px] w-[22px]" /></button>
          <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush">
            <Heart className="h-[22px] w-[22px]" />
            {wishlist.size > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{wishlist.size}</span>}
          </Link>
          <CartButton />
          <div className="relative hidden lg:block">
            <button onClick={() => setMenu((m) => !m)} aria-label="Account" aria-expanded={menu} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush"><User className="h-[22px] w-[22px]" /></button>
            {menu && (
              <div className="card absolute right-0 top-full mt-2 w-56 p-2" onMouseLeave={() => setMenu(false)}>
                {user ? (
                  <>
                    <p className="truncate px-4 py-2 text-sm text-muted">{user.fullName}</p>
                    {[["/account", "My account"], ["/account/orders", "My orders"], ["/wishlist", "Wishlist"]].map(([h, l]) => (
                      <Link key={h} href={h} onClick={() => setMenu(false)} className="block rounded-xl px-4 py-2.5 hover:bg-blush">{l}</Link>
                    ))}
                    <button onClick={() => { setMenu(false); logout(); }} className="block w-full rounded-xl px-4 py-2.5 text-left hover:bg-blush">Log out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenu(false)} className="block rounded-xl px-4 py-2.5 hover:bg-blush">Log in</Link>
                    <Link href="/signup" onClick={() => setMenu(false)} className="block rounded-xl px-4 py-2.5 hover:bg-blush">Create account</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <SearchBar open={search} onClose={() => setSearch(false)} />
    </header>
  );
}
