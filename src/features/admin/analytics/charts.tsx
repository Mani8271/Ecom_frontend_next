"use client";

import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarChart, BarPlot } from "@mui/x-charts/BarChart";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import { ChartsDataProvider } from "@mui/x-charts/ChartsDataProvider";
import { ChartsSurface } from "@mui/x-charts/ChartsSurface";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { formatCompactPrice, formatNumber, formatPeriod, formatPrice } from "@/lib/format";
import { chart } from "@/theme/colors";

export const CHART_COLORS = [...chart];

/** Card with title, optional action, loading skeleton, error and empty states. */
export function ChartCard({
  title,
  subtitle,
  action,
  loading,
  error,
  onRetry,
  empty,
  height = 300,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: boolean;
  height?: number;
  children: ReactNode;
}) {
  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, minWidth: 0, height: "100%" }}>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {loading ? (
        <Skeleton variant="rounded" height={height} />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : empty ? (
        <Stack sx={{ height, alignItems: "center", justifyContent: "center", color: "text.secondary", gap: 1 }}>
          <InsightsOutlinedIcon />
          <Typography variant="body2">No data for this period</Typography>
        </Stack>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>{children}</Box>
      )}
    </Box>
  );
}

function Legend({ items }: { items: { label: string; color: string; shape: "line" | "bar" }[] }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mb: 0.5 }}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 14, height: item.shape === "line" ? 3 : 10, borderRadius: 1, bgcolor: item.color }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/** Revenue (line, left axis) and orders (bars, right axis) on one time axis, one tooltip. */
export function RevenueOrdersChart({ series, height = 320 }: { series: { period: string; revenue: string; orders: number }[]; height?: number }) {
  const labels = series.map((p) => formatPeriod(p.period));

  return (
    <Box sx={{ minWidth: Math.max(320, series.length * 16) }}>
      <Legend
        items={[
          { label: "Revenue", color: CHART_COLORS[0], shape: "line" },
          { label: "Orders", color: CHART_COLORS[1], shape: "bar" },
        ]}
      />
      <ChartsDataProvider
        height={height}
        xAxis={[{ id: "x", scaleType: "band", data: labels, tickLabelStyle: { fontSize: 11 } }]}
        yAxis={[
          { id: "revenue", valueFormatter: (v: number | null) => formatCompactPrice(v), width: 64 },
          { id: "orders", position: "right", valueFormatter: (v: number | null) => formatNumber(v), width: 40 },
        ]}
        series={[
          { type: "bar", data: series.map((p) => p.orders), label: "Orders", yAxisId: "orders", color: CHART_COLORS[1], valueFormatter: (v) => formatNumber(v) },
          { type: "line", data: series.map((p) => Number(p.revenue)), label: "Revenue", yAxisId: "revenue", color: CHART_COLORS[0], showMark: series.length <= 31, valueFormatter: (v) => formatPrice(v) },
        ]}
        margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
      >
        <ChartsSurface>
          <ChartsAxisHighlight x="band" />
          <BarPlot borderRadius={3} />
          <LinePlot />
          <MarkPlot />
          <ChartsXAxis axisId="x" />
          <ChartsYAxis axisId="revenue" />
          <ChartsYAxis axisId="orders" />
        </ChartsSurface>
        <ChartsTooltip trigger="axis" />
      </ChartsDataProvider>
    </Box>
  );
}

export function RevenueBarChart({ series, height = 280 }: { series: { period: string; revenue: string }[]; height?: number }) {
  return (
    <Box sx={{ minWidth: Math.max(320, series.length * 40) }}>
      <BarChart
        height={height}
        xAxis={[{ scaleType: "band", data: series.map((p) => formatPeriod(p.period)) }]}
        yAxis={[{ valueFormatter: (v: number | null) => formatCompactPrice(v), width: 64 }]}
        series={[{ data: series.map((p) => Number(p.revenue)), label: "Revenue", color: CHART_COLORS[0], valueFormatter: (v) => formatPrice(v) }]}
        hideLegend
        margin={{ left: 8, right: 8, top: 16, bottom: 8 }}
      />
    </Box>
  );
}

export function DonutChart({ data, height = 260, money = false }: { data: { label: string; value: number }[]; height?: number; money?: boolean }) {
  const visible = data.filter((d) => d.value > 0);
  return (
    <PieChart
      height={height}
      series={[
        {
          data: visible.map((d, i) => ({ id: d.label, label: d.label, value: d.value, color: CHART_COLORS[i % CHART_COLORS.length] })),
          innerRadius: "55%",
          paddingAngle: 1.5,
          cornerRadius: 4,
          valueFormatter: (item) => (money ? formatPrice(item.value) : formatNumber(item.value)),
        },
      ]}
      slotProps={{ legend: { direction: "vertical", position: { vertical: "middle", horizontal: "end" } } }}
    />
  );
}

/** Horizontal bars for rankings (category / brand / payment method). */
export function RankBarChart({ rows, money = true, height }: { rows: { label: string; value: number }[]; money?: boolean; height?: number }) {
  return (
    <BarChart
      layout="horizontal"
      height={height ?? Math.max(180, rows.length * 40)}
      yAxis={[{ scaleType: "band", data: rows.map((r) => r.label), width: 110, tickLabelStyle: { fontSize: 12 } }]}
      xAxis={[{ valueFormatter: (v: number | null) => (money ? formatCompactPrice(v) : formatNumber(v)) }]}
      series={[{ data: rows.map((r) => r.value), color: CHART_COLORS[0], valueFormatter: (v) => (money ? formatPrice(v) : formatNumber(v)) }]}
      hideLegend
      margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
    />
  );
}
