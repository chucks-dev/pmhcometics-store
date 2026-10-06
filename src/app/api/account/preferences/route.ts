import { requireUser } from "@/server/auth/guards";
import { query } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";
import { preferencesSchema } from "@/lib/validation/auth";

export const GET = route(async () => {
  const user = await requireUser();
  const [p] = await query(
    `SELECT skin_type AS "skinType", interests, goals, onboarding_completed AS "onboardingCompleted"
       FROM user_preferences WHERE user_id = $1`, [user.id]);
  return ok({ preferences: p ?? null });
});

// Used by onboarding (steps 1-3) and by /account/preferences.
export const PUT = route(async (req) => {
  const user = await requireUser();
  const { skinType, interests, goals } = await parseJson(req, preferencesSchema);
  await query(
    `INSERT INTO user_preferences (user_id, skin_type, interests, goals, onboarding_completed)
     VALUES ($1,$2,$3,$4,true)
     ON CONFLICT (user_id) DO UPDATE
       SET skin_type = EXCLUDED.skin_type, interests = EXCLUDED.interests,
           goals = EXCLUDED.goals, onboarding_completed = true`,
    [user.id, skinType, interests, goals],
  );
  return ok({ redirect: "/" });
});
