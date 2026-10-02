import type { Metadata } from "next";
import { PageContainer } from "@/components/common/PageContainer";
import { WishlistView } from "@/features/cart/components/WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };

export default function WishlistPage() {
  return (
    <PageContainer>
      <WishlistView />
    </PageContainer>
  );
}
