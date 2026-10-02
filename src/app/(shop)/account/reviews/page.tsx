import type { Metadata } from "next";
import { MyReviews } from "@/features/reviews/MyReviews";

export const metadata: Metadata = { title: "My reviews" };

export default function AccountReviewsPage() {
  return <MyReviews />;
}
