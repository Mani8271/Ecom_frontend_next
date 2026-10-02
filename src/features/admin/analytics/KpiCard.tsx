import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatNumber, formatPrice } from "@/lib/format";
import type { Kpi } from "@/services/admin/analytics.types";

/** Value + change vs the previous equivalent period (green = good, red = bad). */
export function KpiCard({ kpi, compareLabel }: { kpi: Kpi; compareLabel?: string }) {
  const value = kpi.format === "money" ? formatPrice(kpi.value) : formatNumber(kpi.value);
  const change = kpi.change_pct;
  const good = change === null ? null : kpi.lower_is_better ? change <= 0 : change >= 0;

  return (
    <Box sx={{ p: 2, height: "100%", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
        {kpi.label}
      </Typography>
      <Typography variant="h5" component="p" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>
        {value}
      </Typography>
      <Box sx={{ flex: 1 }} />
      {change !== null ? (
        <Tooltip title={`Previous: ${kpi.format === "money" ? formatPrice(kpi.previous) : formatNumber(kpi.previous)}`}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: good ? "success.main" : "error.main" }}>
            {change >= 0 ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />}
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
              {kpi.note?.startsWith("vs") ? kpi.note : (compareLabel ?? "vs previous period")}
            </Typography>
          </Stack>
        </Tooltip>
      ) : (
        <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
          {kpi.previous !== null && kpi.previous !== undefined ? "No sales in previous period" : (kpi.note ?? "")}
        </Typography>
      )}
    </Box>
  );
}

export function KpiSkeleton() {
  return (
    <Box sx={{ p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Skeleton width="60%" />
      <Skeleton height={40} width="80%" />
      <Skeleton width="50%" />
    </Box>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" } }}>{children}</Box>;
}
