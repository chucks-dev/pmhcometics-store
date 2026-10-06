import { query } from "./db/client";
import { DEFAULT_DELIVERY } from "@/lib/constants";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await query<{ value: T }>(`SELECT value FROM settings WHERE key = $1`, [key]);
  return rows[0] ? { ...fallback, ...rows[0].value } : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1,$2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export const getDeliveryConfig = () => getSetting("delivery", DEFAULT_DELIVERY);
export const getStoreSettings = () =>
  getSetting("store", { name: "PMHCOSMETICS", supportEmail: "support@yourdomain.com", supportPhone: "+234 800 000 0000" });
