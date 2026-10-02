import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ProfilePanel } from "./ProfilePanel";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your personal details and profile photo." />
      <ProfilePanel />
    </>
  );
}
