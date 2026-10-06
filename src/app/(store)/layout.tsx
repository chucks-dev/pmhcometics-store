import { Footer } from "@/components/store/Footer";
import { MobileBottomNav } from "@/components/store/MobileBottomNav";
import { Navbar } from "@/components/store/Navbar";
import { StoreProvider } from "@/components/store/StoreProvider";
import { ToastProvider } from "@/components/ui/feedback";
import { getCategories } from "@/server/catalog";
import { getStoreSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, store] = await Promise.all([getCategories(), getStoreSettings()]);
  return (
    <ToastProvider>
      <StoreProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
        <Navbar categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        <main id="main" className="min-h-[60vh] pb-24 lg:pb-0">{children}</main>
        <Footer supportEmail={store.supportEmail} supportPhone={store.supportPhone} />
        <MobileBottomNav />
      </StoreProvider>
    </ToastProvider>
  );
}
