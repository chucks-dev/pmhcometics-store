import Link from "next/link";
import { ToastProvider } from "@/components/ui/feedback";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col items-center px-4 py-8">
        <Link href="/" className="font-display text-3xl text-brand-700">PMHCOSMETICS</Link>
        <main className="mt-8 w-full max-w-md">{children}</main>
      </div>
    </ToastProvider>
  );
}
