import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { SecurityPanel } from "@/features/account/components/SecurityPanel";

export const metadata: Metadata = { title: "Settings" };

export default function AccountSettingsPage() {
  return (
    <>
      <PageHeader title="Account settings" description="Password, email and phone verification, and signed-in devices." />
      <SecurityPanel />
    </>
  );
}
