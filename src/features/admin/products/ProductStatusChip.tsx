import Chip from "@mui/material/Chip";
import type { ProductStatus } from "@/services/admin/types";

const STYLES: Record<ProductStatus, { label: string; color: "success" | "default" | "warning" }> = {
  active: { label: "Active", color: "success" },
  draft: { label: "Draft", color: "warning" },
  archived: { label: "Archived", color: "default" },
};

export function ProductStatusChip({ status }: { status: ProductStatus }) {
  const style = STYLES[status];
  return <Chip size="small" variant="outlined" label={style.label} color={style.color} />;
}
