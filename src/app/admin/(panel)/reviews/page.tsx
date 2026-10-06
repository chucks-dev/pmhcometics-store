import { ReviewsAdmin } from "@/components/admin/DiscountsReviews";
import { guardPage } from "@/server/admin/page-guard";
export const metadata = { title: "Reviews" };
export default async function Page() { await guardPage("reviews:moderate"); return <ReviewsAdmin />; }
