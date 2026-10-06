import { redirect } from "next/navigation";
import { PreferencesForm } from "@/components/store/PreferencesForm";
import { getCurrentUser } from "@/server/auth/guards";

export const metadata = { title: "Your beauty preferences" };

export default async function Onboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="mb-1 text-3xl">Hi {user.full_name.split(" ")[0]}, let&apos;s personalise this</h1>
      <p className="mb-6 text-muted">Three quick questions so we can show products that suit you.</p>
      <PreferencesForm wizard />
    </div>
  );
}
