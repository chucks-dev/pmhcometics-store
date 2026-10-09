import Link from "next/link";
import { Logo } from "./Navbar";

const COLS = [
  { title: "Shop", links: [["/shop", "All products"], ["/category/skincare", "Skincare"], ["/category/fragrance", "Fragrance"], ["/category/new-arrivals", "New arrivals"]] },
  { title: "Company", links: [["/about", "About"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
  { title: "Legal", links: [["/privacy", "Privacy Policy"], ["/terms", "Terms"]] },
];

export function Footer({ supportEmail, supportPhone }: { supportEmail: string; supportPhone: string }) {
  return (
    <footer className="mt-20 border-t border-line bg-white pb-24 lg:pb-0">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-muted"> Skincare, fragrance and beauty essentials, carefully selected and delivered across Nigeria.</p>
          <div className="mt-4 flex gap-4 text-sm font-medium">
            {["Instagram", "TikTok", "X"].map((s) => <a key={s} href="#" className="hover:text-brand-600" rel="noopener">{s}</a>)}
          </div>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="font-sans text-base font-semibold">{c.title}</h3>
            <ul className="mt-3 space-y-2">{c.links.map(([h, l]) => <li key={h}><Link href={h} className="text-muted hover:text-brand-600">{l}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-sm text-muted sm:flex-row sm:justify-between">
          <p>Customer support: <a className="hover:text-brand-600" href={`mailto:${supportEmail}`}>{supportEmail}</a> · {supportPhone}</p>
          <p>© {new Date().getFullYear()} PMHCOSMETICS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
