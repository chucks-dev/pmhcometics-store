import { query } from "../db/client";

export async function audit(entry: {
  actorType: "admin" | "customer" | "system";
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  await query(
    `INSERT INTO audit_logs (actor_type, actor_id, action, entity_type, entity_id, metadata, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      entry.actorType,
      entry.actorId ?? null,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      JSON.stringify(entry.metadata ?? {}),
      entry.ip ?? null,
    ],
  );
}
