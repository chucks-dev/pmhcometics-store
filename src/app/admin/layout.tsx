import { ToastProvider } from "@/components/ui/feedback";

export const metadata = { title: { default: "Admin", template: "%s · PMHCOSMETICS Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <ToastProvider><div className="min-h-screen bg-[#FAF5F7]">{children}</div></ToastProvider>;
}
