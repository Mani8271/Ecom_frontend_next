import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { CartTotals } from "@/services/cart/types";

function Row({ label, value, tone, strong }: { label: ReactNode; value: string; tone?: "success"; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
      <Typography variant={strong ? "subtitle1" : "body2"} sx={{ color: strong ? "text.primary" : "text.secondary", fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant={strong ? "subtitle1" : "body2"} sx={{ fontWeight: strong ? 700 : 500, color: tone === "success" ? "success.main" : "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Price breakdown. Every number comes from the server. */
export function OrderSummary({ totals, itemCount, couponCode, children }: { totals: CartTotals; itemCount: number; couponCode?: string | null; children?: ReactNode }) {
  const toFree = Number(totals.amount_to_free_shipping);
  const freeAbove = Number(totals.free_shipping_above);
  const progress = freeAbove > 0 ? Math.min(100, ((freeAbove - toFree) / freeAbove) * 100) : 100;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Price details ({itemCount} item{itemCount === 1 ? "" : "s"})
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 1.5 }}>
        <Row label="Total MRP" value={formatPrice(totals.mrp_total)} />
        {Number(totals.product_discount) > 0 && <Row label="Discount on MRP" value={`− ${formatPrice(totals.product_discount)}`} tone="success" />}
        {Number(totals.coupon_discount) > 0 && <Row label={`Coupon${couponCode ? ` (${couponCode})` : ""}`} value={`− ${formatPrice(totals.coupon_discount)}`} tone="success" />}
        <Row label="Delivery" value={Number(totals.shipping) > 0 ? formatPrice(totals.shipping) : "FREE"} tone={Number(totals.shipping) > 0 ? undefined : "success"} />
        {Number(totals.cod_fee) > 0 && <Row label="Cash on Delivery fee" value={formatPrice(totals.cod_fee)} />}
        <Divider />
        <Row label="Total amount" value={formatPrice(totals.grand_total)} strong />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Includes {formatPrice(totals.tax_included)} GST
        </Typography>
        {Number(totals.total_savings) > 0 && (
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "primary.light", color: "primary.dark", textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              You save {formatPrice(totals.total_savings)} on this order
            </Typography>
          </Box>
        )}
        {toFree > 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Add {formatPrice(toFree)} more for FREE delivery
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.5, borderRadius: 1 }} />
          </Box>
        )}
      </Stack>
      {children && <Box sx={{ mt: 2.5 }}>{children}</Box>}
    </Box>
  );
}
