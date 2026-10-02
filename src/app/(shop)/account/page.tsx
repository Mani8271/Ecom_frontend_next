import type { Metadata } from "next";
import { AccountOverview } from "@/features/account/components/AccountOverview";

export const metadata: Metadata = { title: "Overview" };

export default function AccountIndexPage() {
  return <AccountOverview />;
}
