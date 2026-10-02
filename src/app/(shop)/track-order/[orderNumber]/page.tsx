import type { Metadata } from "next";
import { PageContainer } from "@/components/common/PageContainer";
import { TrackOrderView } from "@/features/orders/components/TrackOrderView";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

export default async function TrackOrderNumberPage({ params }: PageProps<"/track-order/[orderNumber]">) {
  const { orderNumber } = await params;
  return (
    <PageContainer>
      <TrackOrderView orderNumber={orderNumber} />
    </PageContainer>
  );
}
