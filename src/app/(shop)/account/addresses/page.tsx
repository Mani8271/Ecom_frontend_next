import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { AddressesPanel } from "@/features/account/components/AddressesPanel";

export const metadata: Metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <>
      <PageHeader title="Addresses" description="Manage your delivery addresses." />
      <AddressesPanel />
    </>
  );
}
