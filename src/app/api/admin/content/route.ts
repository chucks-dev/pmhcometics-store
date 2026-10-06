import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { logAdmin } from "@/server/admin/helpers";
import { getHomepageContent } from "@/server/catalog";
import { query } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";

const schema = z.object({
  hero: z.object({
    title: z.string().trim().min(2).max(120), description: z.string().trim().max(300),
    imageUrl: z.string().url().max(500).optional().nullable(),
    ctaLabel: z.string().trim().min(2).max(30), ctaHref: z.string().trim().max(200).regex(/^\//, "Use a path like /shop"),
  }),
  banners: z.array(z.object({
    title: z.string().trim().min(2).max(80), text: z.string().trim().max(160),
    href: z.string().trim().max(200).regex(/^\//), imageUrl: z.string().url().max(500).optional().nullable(),
  })).max(4),
  featuredIds: z.array(z.string().uuid()).max(12),
  newArrivalIds: z.array(z.string().uuid()).max(12),
  bestSellerIds: z.array(z.string().uuid()).max(12),
});

export const GET = route(async () => {
  await requireAdmin("content:write");
  return ok({ content: await getHomepageContent() });
});

export const PUT = route(async (req) => {
  const ctx = await requireAdmin("content:write");
  const c = await parseJson(req, schema);
  const entries: [string, unknown][] = [["hero", c.hero], ["banners", c.banners], ["featured_ids", c.featuredIds], ["new_arrival_ids", c.newArrivalIds], ["best_seller_ids", c.bestSellerIds]];
  for (const [key, value] of entries) {
    await query(
      `INSERT INTO homepage_content (key, value, updated_by) VALUES ($1,$2,$3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [key, JSON.stringify(value), ctx.admin.id]);
  }
  await logAdmin(ctx, req, "content.update", "homepage");
  return ok({ ok: true });
});
