import type { Metadata } from "next";
import { AttributesPanel } from "@/features/admin/catalog/AttributesPanel";

export const metadata: Metadata = { title: "Attributes" };

export default function AdminAttributesPage() {
  return <AttributesPanel />;
}
