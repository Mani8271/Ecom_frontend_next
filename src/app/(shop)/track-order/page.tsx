import type { Metadata } from "next";
import { PageContainer } from "@/components/common/PageContainer";
import { TrackOrderView } from "@/features/orders/components/TrackOrderView";

export const metadata: Metadata = { title: "Track your order", description: "Check the delivery status of your Loomi Trends order." };

export default function TrackOrderPage() {
  return (
    <PageContainer>
      <TrackOrderView />
    </PageContainer>
  );
}
