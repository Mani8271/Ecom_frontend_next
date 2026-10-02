import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { SecurityPanel } from "@/features/account/components/SecurityPanel";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <>
      <PageHeader title="Security" description="Password, verification and signed-in devices." />
      <SecurityPanel />
    </>
  );
}
