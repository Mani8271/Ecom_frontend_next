import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { WishlistView } from "@/features/cart/components/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

export default function AccountWishlistPage() {
  return (
    <>
      <PageHeader title="Wishlist" description="Products you saved for later." />
      <WishlistView heading={false} />
    </>
  );
}
