import { DiscountsAdmin } from "@/components/admin/DiscountsReviews";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Discounts" };
export default async function Page() { await guardPage("discounts:write"); return <DiscountsAdmin />; }
