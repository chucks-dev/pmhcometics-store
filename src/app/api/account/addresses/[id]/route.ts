import { requireUser } from "@/server/auth/guards";
import { tx } from "@/server/db/client";
import { HttpError, ok, parseJson, route, type IdCtx } from "@/server/http";
import { addressSchema } from "@/lib/validation/address";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const a = await parseJson(req, addressSchema);
  await tx(async (c) => {
    if (a.isDefault) await c.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [user.id]);
    const r = await c.query(
      `UPDATE addresses SET label=$3, full_name=$4, phone=$5, state=$6, city=$7, street=$8, additional_info=$9, is_default = COALESCE($10, is_default)
        WHERE id = $1 AND user_id = $2`,
      [id, user.id, a.label ?? null, a.fullName, a.phone, a.state, a.city, a.street, a.additionalInfo ?? null, a.isDefault ?? null]);
    if (!r.rowCount) throw new HttpError(404, "Address not found.");
  });
  return ok({ ok: true });
});

export const DELETE = route<IdCtx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await tx(async (c) => {
    const { rows } = await c.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING is_default`, [id, user.id]);
    if (rows[0]?.is_default) {
      await c.query(`UPDATE addresses SET is_default = true WHERE id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)`, [user.id]);
    }
  });
  return ok({ ok: true });
});
