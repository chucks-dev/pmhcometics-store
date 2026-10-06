import { PreferencesForm } from "@/components/store/PreferencesForm";
import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";

export const metadata = { title: "Beauty preferences" };

export default async function PreferencesPage() {
  const user = await requireUser();
  const [p] = await query<any>(`SELECT skin_type, interests, goals FROM user_preferences WHERE user_id = $1`, [user.id]);
  return (
    <>
      <h1 className="mb-1 text-3xl">Beauty preferences</h1>
      <p className="mb-8 text-muted">We use these to choose the products we show you.</p>
      <PreferencesForm initial={p ? { skinType: p.skin_type, interests: p.interests, goals: p.goals } : null} />
    </>
  );
}
