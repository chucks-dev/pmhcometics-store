import { InventoryAdmin } from "@/components/admin/InventoryAdmin";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Inventory" };
export default async function Page() { await guardPage("inventory:write"); return <InventoryAdmin />; }
