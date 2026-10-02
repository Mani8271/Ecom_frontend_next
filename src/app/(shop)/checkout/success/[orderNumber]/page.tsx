import type { Metadata } from "next";
import { PageContainer } from "@/components/common/PageContainer";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";

export const metadata: Metadata = { title: "Order placed", robots: { index: false, follow: false } };

export default async function OrderPlacedPage({ params }: PageProps<"/checkout/success/[orderNumber]">) {
  const { orderNumber } = await params;
  return (
    <PageContainer maxWidth="lg">
      <OrderDetailView orderNumber={orderNumber} justPlaced />
    </PageContainer>
  );
}
