import type { Metadata } from "next";
import { CartView } from "@/features/cart/components/CartView";

export const metadata: Metadata = { title: "Shopping bag", robots: { index: false, follow: false } };

export default function CartPage() {
  return <CartView />;
}
