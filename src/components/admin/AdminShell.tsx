"use client";
import { Bell, Boxes, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Package, Percent, Settings, ShieldCheck, ShoppingBag, Star, Tags, Users, BarChart3, Warehouse, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api, cn } from "@/lib/api";

const NAV: { group: string; items: { href: string; label: string; Icon: any; perm: string }[] }[] = [
  { group: "", items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard, perm: "dashboard:view" }] },
  { group: "Catalogue", items: [
    { href: "/admin/products", label: "Products", Icon: Package, perm: "products:read" },
    { href: "/admin/categories", label: "Categories", Icon: Tags, perm: "products:read" },
    { href: "/admin/inventory", label: "Inventory", Icon: Warehouse, perm: "inventory:write" }] },
  { group: "Sales", items: [
    { href: "/admin/orders", label: "Orders", Icon: ShoppingBag, perm: "orders:read" },
    { href: "/admin/customers", label: "Customers", Icon: Users, perm: "customers:read" },
    { href: "/admin/payments", label: "Payments", Icon: CreditCard, perm: "payments:read" }] },
  { group: "Marketing", items: [
    { href: "/admin/discounts", label: "Discounts", Icon: Percent, perm: "discounts:write" },
    { href: "/admin/reviews", label: "Reviews", Icon: Star, perm: "reviews:moderate" }] },
  { group: "Site", items: [
    { href: "/admin/content", label: "Homepage Content", Icon: FileText, perm: "content:write" },
    { href: "/admin/notifications", label: "Notifications", Icon: Bell, perm: "dashboard:view" }] },
  { group: "Insights", items: [{ href: "/admin/reports", label: "Reports", Icon: BarChart3, perm: "reports:view" }] },
  { group: "System", items: [
    { href: "/admin/users", label: "Admin Users", Icon: ShieldCheck, perm: "admins:manage" },
    { href: "/admin/settings", label: "Settings", Icon: Settings, perm: "settings:manage" }] },
];

export function AdminShell({ admin, permissions, children }: { admin: { fullName: string; email: string; role: string }; permissions: string[]; children: React.ReactNode }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  const logout = async () => { await api("/api/admin/auth/logout", { body: {} }).catch(() => {}); window.location.href = "/admin/login"; };
  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col overflow-y-auto p-4">
      <p className="mb-4 px-3 font-display text-2xl text-brand-700">PMHCOSMETICS</p>
      {NAV.map((g) => {
        const items = g.items.filter((i) => permissions.includes(i.perm));
        if (!items.length) return null;
        return (
          <div key={g.group || "top"} className="mb-3">
            {g.group && <p className="mb-1 px-3 text-xs font-medium text-muted">{g.group}</p>}
            {items.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-[15px] font-medium", active ? "bg-brand-500 text-white" : "hover:bg-blush")}>
                  <Icon className="h-[18px] w-[18px]" />{label}
                </Link>
              );
            })}
          </div>
        );
      })}
      <button onClick={logout} className="mt-auto flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-[15px] font-medium text-muted hover:bg-blush"><LogOut className="h-[18px] w-[18px]" />Logout</button>
    </nav>
  );
  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white lg:block">{nav}</aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:px-8">
          <button className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="hidden text-sm text-muted lg:block"><Boxes className="mr-1.5 inline h-4 w-4" />Store admin</span>
          <div className="text-right text-sm"><p className="font-medium leading-tight">{admin.fullName}</p><p className="text-xs capitalize text-muted">{admin.role.replace("_", " ")}</p></div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-slideUp bg-white shadow-lift">
            <button className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            {nav}
          </div>
        </div>
      )}
    </div>
  );
}

