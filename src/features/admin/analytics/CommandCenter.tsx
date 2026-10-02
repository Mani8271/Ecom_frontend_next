"use client";

import LaunchIcon from "@mui/icons-material/Launch";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState, type ReactNode } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { PageHeader } from "@/components/common/PageHeader";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import { analyticsService, inventoryService } from "@/services/admin/analytics.service";
import type { Granularity } from "@/services/admin/analytics.types";
import { OrderStatusChip } from "@/features/orders/components/OrderStatusChip";
import type { OrderStatus } from "@/services/orders/types";
import { AnalyticsFiltersBar } from "./AnalyticsFiltersBar";
import { ChartCard, DonutChart, RankBarChart, RevenueOrdersChart } from "./charts";
import { KpiCard, KpiGrid, KpiSkeleton } from "./KpiCard";
import { useAnalyticsFilters } from "./useAnalyticsFilters";
import { useAnalyticsQuery } from "./useAnalyticsQuery";

const AUTO_REFRESH_MS = 5 * 60_000;

export function Section({ children, columns }: { children: ReactNode; columns: Record<string, string> }) {
  return <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", ...columns }, mt: 2.5 }}>{children}</Box>;
}

function MoneyRow({ label, value, strong, negative, hint }: { label: string; value: string; strong?: boolean; negative?: boolean; hint?: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5 }}>
      <Tooltip title={hint ?? ""} placement="left">
        <Typography variant="body2" sx={{ color: strong ? "text.primary" : "text.secondary", fontWeight: strong ? 700 : 400 }}>
          {label}
        </Typography>
      </Tooltip>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500, color: negative ? "error.main" : "text.primary" }}>
        {negative && Number(value) > 0 ? "− " : ""}
        {formatPrice(value)}
      </Typography>
    </Stack>
  );
}

/** /admin — the command centre. Every figure comes from /admin/dashboard/* aggregates. */
export function CommandCenter() {
  const { hasPermission } = useAuth();
  const { query } = useAnalyticsFilters();
  const [nonce, setNonce] = useState(0);
  const [auto, setAuto] = useState(false);
  const [granularity, setGranularity] = useState<Granularity | "auto">("auto");
  const interval = auto ? AUTO_REFRESH_MS : false;
  const salesQuery = granularity === "auto" ? query : { ...query, granularity };

  const summary = useAnalyticsQuery("summary", analyticsService.summary, query, nonce, { refetchInterval: interval });
  const sales = useAnalyticsQuery("sales", analyticsService.sales, salesQuery, nonce, { refetchInterval: interval });
  const orders = useAnalyticsQuery("orders", analyticsService.orders, query, nonce, { refetchInterval: interval });
  const financial = useAnalyticsQuery("financial", analyticsService.financial, query, nonce);
  const payments = useAnalyticsQuery("payments", analyticsService.payments, query, nonce, { enabled: hasPermission("payments.view") });
  const categories = useAnalyticsQuery("categories", analyticsService.categories, query, nonce);
  const brands = useAnalyticsQuery("brands", analyticsService.brands, query, nonce);
  const topProducts = useQuery({
    queryKey: ["admin", "analytics", "top-products", query, nonce],
    queryFn: () => analyticsService.products({ ...query, sort: "revenue", limit: 8 }),
  });
  const lowStock = useQuery({
    queryKey: ["admin", "inventory", "low-stock", "dashboard", nonce],
    queryFn: () => inventoryService.lowStock({ limit: 6 }),
    enabled: hasPermission("inventory.view"),
    refetchInterval: interval,
  });

  const refreshing = summary.isFetching || sales.isFetching;
  const fin = financial.data;

  return (
    <>
      <PageHeader
        title="Command centre"
        description="Sales, orders, customers and stock from live store data."
        action={
          <FormControlLabel control={<Switch checked={auto} onChange={(e) => setAuto(e.target.checked)} />} label="Auto-refresh (5 min)" sx={{ color: "text.secondary" }} />
        }
      />
      <AnalyticsFiltersBar applied={summary.data?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={refreshing} />

      {summary.error ? (
        <Alert severity="error">Couldn&apos;t load the dashboard. Check that the API is running, then refresh.</Alert>
      ) : (
        <KpiGrid>
          {summary.isLoading || !summary.data
            ? Array.from({ length: 12 }, (_, i) => <KpiSkeleton key={i} />)
            : summary.data.kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />)}
        </KpiGrid>
      )}

      <Section columns={{ lg: "minmax(0, 2fr) minmax(0, 1fr)" }}>
        <ChartCard
          title="Revenue vs orders"
          subtitle={
            sales.data
              ? `${formatPrice(sales.data.totals.revenue)} from ${formatNumber(sales.data.totals.orders)} orders · AOV ${formatPrice(sales.data.totals.aov)}${
                  sales.data.totals.revenue_growth_pct !== null ? ` · ${sales.data.totals.revenue_growth_pct > 0 ? "+" : ""}${sales.data.totals.revenue_growth_pct}% vs previous` : ""
                }`
              : undefined
          }
          action={
            <ToggleButtonGroup size="small" exclusive value={granularity} onChange={(_, v) => v && setGranularity(v)} aria-label="Group by">
              <ToggleButton value="auto">Auto</ToggleButton>
              <ToggleButton value="day">Daily</ToggleButton>
              <ToggleButton value="month">Monthly</ToggleButton>
              <ToggleButton value="year">Yearly</ToggleButton>
            </ToggleButtonGroup>
          }
          loading={sales.isLoading}
          error={sales.error}
          onRetry={() => sales.refetch()}
          empty={Boolean(sales.data && sales.data.series.every((p) => p.orders === 0))}
        >
          {sales.data && <RevenueOrdersChart series={sales.data.series} />}
        </ChartCard>

        <ChartCard title="Order status" subtitle={orders.data ? `${formatNumber(orders.data.totals.total)} orders placed in period` : undefined} loading={orders.isLoading} error={orders.error} empty={orders.data?.totals.total === 0}>
          {orders.data && <DonutChart data={orders.data.distribution.map((d) => ({ label: d.label, value: d.count }))} height={300} />}
        </ChartCard>
      </Section>

      <Section columns={{ md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }}>
        <ChartCard title="Financial summary" subtitle="Formulas: hover a line" loading={financial.isLoading} error={financial.error} height={260}>
          {fin && (
            <Box>
              <MoneyRow label="Gross sales (MRP)" value={fin.gross_sales} hint="Σ MRP × quantity" />
              <MoneyRow label="Product discounts" value={fin.product_discounts} negative hint="Σ (MRP − selling price) × quantity" />
              <MoneyRow label="Coupon discounts" value={fin.coupon_discounts} negative />
              <MoneyRow label="Shipping & COD fees" value={fin.shipping_revenue} />
              <MoneyRow label="Refunds" value={fin.refunds} negative hint="Refunds completed in the period" />
              <Divider sx={{ my: 1 }} />
              <MoneyRow label="Net sales" value={fin.net_sales} strong hint={fin.formulas.net_sales} />
              <MoneyRow label="GST included" value={fin.tax_collected} />
              <MoneyRow label="Net sales excl. GST" value={fin.net_sales_ex_tax} />
              <Divider sx={{ my: 1 }} />
              {fin.profit.available ? (
                <>
                  <MoneyRow label="Cost of goods sold" value={fin.profit.cost_of_goods} negative />
                  <MoneyRow label="Gross profit" value={fin.profit.gross_profit} strong hint={fin.formulas.gross_profit} />
                </>
              ) : (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {fin.profit.reason} Add cost prices to variants to see profit.
                </Typography>
              )}
            </Box>
          )}
        </ChartCard>

        {hasPermission("payments.view") && (
          <ChartCard
            title="Payment methods"
            subtitle={payments.data ? `Paid ${formatPrice(payments.data.totals.paid)}${payments.data.totals.online_success_rate !== null ? ` · online success ${payments.data.totals.online_success_rate}%` : ""}` : undefined}
            loading={payments.isLoading}
            error={payments.error}
            empty={payments.data?.methods.length === 0}
            height={260}
          >
            {payments.data && <DonutChart money data={payments.data.methods.map((m) => ({ label: m.label, value: Number(m.amount) }))} />}
          </ChartCard>
        )}

        {hasPermission("inventory.view") && (
          <ChartCard
            title="Low stock alerts"
            action={
              <LinkButton href={routes.admin.lowStock} size="small">
                View all
              </LinkButton>
            }
            loading={lowStock.isLoading}
            error={lowStock.error}
            height={260}
          >
            {lowStock.data && (lowStock.data.data.length === 0 ? (
              <Typography variant="body2" sx={{ color: "success.main", py: 2 }}>
                All sellable variants are above their low-stock threshold.
              </Typography>
            ) : (
              <Stack spacing={1} divider={<Divider flexItem />}>
                {lowStock.data.data.map((row) => (
                  <Stack key={row.variant_id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {row.product_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {row.sku} · stock {row.available} / threshold {row.low_stock_threshold}
                      </Typography>
                    </Box>
                    <Chip size="small" color="warning" variant="outlined" label={`Reorder ${row.recommended_reorder}`} />
                  </Stack>
                ))}
              </Stack>
            ))}
          </ChartCard>
        )}
      </Section>

      <Section columns={{ lg: "minmax(0, 3fr) minmax(0, 2fr)" }}>
        <ChartCard
          title="Top selling products"
          subtitle="By revenue in the selected period"
          action={
            <LinkButton href={routes.admin.analytics} size="small">
              Product analytics
            </LinkButton>
          }
          loading={topProducts.isLoading}
          error={topProducts.error}
          empty={topProducts.data?.data.every((p) => p.units_sold === 0)}
        >
          {topProducts.data && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.data.data
                    .filter((p) => p.units_sold > 0)
                    .map((p, i) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <Link component={NextLink} href={routes.admin.product(p.id)} underline="hover" sx={{ color: "text.primary", fontWeight: 600 }}>
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell align="right">{formatNumber(p.units_sold)}</TableCell>
                        <TableCell align="right">{formatNumber(p.orders)}</TableCell>
                        <TableCell align="right">{formatPrice(p.revenue)}</TableCell>
                        <TableCell align="right" sx={{ color: p.stock <= 0 ? "error.main" : undefined }}>
                          {formatNumber(p.stock)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue by category" subtitle="Product sales (excl. shipping)" loading={categories.isLoading} error={categories.error} empty={categories.data && Number(categories.data.total_revenue) === 0}>
          {categories.data && <DonutChart money data={categories.data.rows.slice(0, 7).map((r) => ({ label: r.name, value: Number(r.revenue) }))} height={280} />}
        </ChartCard>
      </Section>

      <Section columns={{ lg: "minmax(0, 2fr) minmax(0, 3fr)" }}>
        <ChartCard title="Revenue by brand" loading={brands.isLoading} error={brands.error} empty={brands.data && Number(brands.data.total_revenue) === 0}>
          {brands.data && <RankBarChart rows={brands.data.rows.filter((r) => Number(r.revenue) > 0).slice(0, 8).map((r) => ({ label: r.name, value: Number(r.revenue) }))} />}
        </ChartCard>

        <ChartCard
          title="Recent orders"
          action={
            <LinkButton href={routes.admin.orders} size="small">
              All orders
            </LinkButton>
          }
          loading={summary.isLoading}
          empty={summary.data?.recent_orders.length === 0}
        >
          {summary.data && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.data.recent_orders.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{o.order_number}</TableCell>
                      <TableCell>{o.customer_name}</TableCell>
                      <TableCell align="right">{o.items}</TableCell>
                      <TableCell align="right">{formatPrice(o.grand_total)}</TableCell>
                      <TableCell>{o.payment_method === "cod" ? "COD" : "Online"}</TableCell>
                      <TableCell>
                        <OrderStatusChip status={o.status as OrderStatus} label={o.status_label} />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(o.placed_at)}</TableCell>
                      <TableCell padding="checkbox">
                        <Tooltip title="View, update status, track, cancel or refund">
                          <IconButton size="small" component={NextLink} href={routes.admin.order(o.id)} aria-label={`Open ${o.order_number}`}>
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </ChartCard>
      </Section>
    </>
  );
}
