import { CustomersAdmin } from "@/components/admin/CustomersPayments";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Customers" };
export default async function Page() { await guardPage("customers:read"); return <CustomersAdmin />; }
