import Chip from "@mui/material/Chip";
import type { OrderStatus } from "@/services/orders/types";

const COLORS: Partial<Record<OrderStatus, "success" | "warning" | "error" | "info" | "primary" | "default">> = {
  payment_pending: "warning",
  placed: "info",
  confirmed: "info",
  processing: "info",
  packed: "info",
  shipped: "primary",
  out_for_delivery: "primary",
  delivered: "success",
  cancelled: "error",
  return_requested: "warning",
  returned: "default",
  refunded: "default",
};

export function OrderStatusChip({ status, label }: { status: OrderStatus; label: string }) {
  return <Chip size="small" label={label} color={COLORS[status] ?? "default"} variant={status === "delivered" ? "filled" : "outlined"} />;
}
