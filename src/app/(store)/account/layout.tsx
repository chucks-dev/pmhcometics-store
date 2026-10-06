import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AccountNav } from "@/components/store/AccountNav";
import { getCurrentUser } from "@/server/auth/guards";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "/account";
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <div className="container-x py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountNav name={user.full_name} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}