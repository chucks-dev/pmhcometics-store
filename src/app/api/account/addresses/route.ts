import { requireUser } from "@/server/auth/guards";
import { query, tx } from "@/server/db/client";
import { ok, parseJson, route } from "@/server/http";
import { addressSchema } from "@/lib/validation/address";

export const GET = route(async () => {
  const user = await requireUser();
  const rows = await query(
    `SELECT id, label, full_name AS "fullName", phone, state, city, street, additional_info AS "additionalInfo", is_default AS "isDefault"
       FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`, [user.id]);
  return ok({ addresses: rows });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const a = await parseJson(req, addressSchema);
  const id = await tx(async (c) => {
    const { rows: [{ n }] } = await c.query(`SELECT COUNT(*) AS n FROM addresses WHERE user_id = $1`, [user.id]);
    const makeDefault = a.isDefault || n === "0";
    if (makeDefault) await c.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [user.id]);
    const { rows: [r] } = await c.query(
      `INSERT INTO addresses (user_id, label, full_name, phone, state, city, street, additional_info, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [user.id, a.label ?? null, a.fullName, a.phone, a.state, a.city, a.street, a.additionalInfo ?? null, makeDefault]);
    return r.id;
  });
  return ok({ id }, { status: 201 });
});
