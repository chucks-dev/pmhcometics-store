import { createAdmin } from "../src/server/auth/admin-users";
import { pool } from "../src/server/db/client";

async function main() {
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_NAME: fullName, SEED_ADMIN_PASSWORD: password } = process.env;
  if (!email || !fullName || !password) throw new Error("Set SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_PASSWORD");
  const { id, otpauthUri } = await createAdmin({ email, fullName, password, role: "super_admin" });
  console.log(`Super admin created: ${id}`);
  console.log("Add this to your authenticator app (paste into any QR generator). It is shown ONCE:\n");
  console.log(otpauthUri);
  console.log("\nNow remove SEED_ADMIN_PASSWORD from your .env.");
  await pool.end();
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
