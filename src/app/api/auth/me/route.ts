import { getCurrentUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { ok, route } from "@/server/http";

export const GET = route(async () => {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null });
  const [prefs] = await query<{ skin_type: string | null; interests: string[]; goals: string[]; onboarding_completed: boolean }>(
    `SELECT skin_type, interests, goals, onboarding_completed FROM user_preferences WHERE user_id = $1`, [user.id]);
  return ok({
    user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
    preferences: prefs
      ? { skinType: prefs.skin_type, interests: prefs.interests, goals: prefs.goals }
      : null,
    onboardingCompleted: prefs?.onboarding_completed ?? false,
  });
});
