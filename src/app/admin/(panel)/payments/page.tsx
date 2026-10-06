import { PaymentsAdmin } from "@/components/admin/CustomersPayments";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Payments" };
export default async function Page() { await guardPage("payments:read"); return <PaymentsAdmin />; }
