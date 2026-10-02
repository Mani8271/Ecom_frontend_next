"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { routes } from "@/config/routes";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { formatNumber, formatPrice } from "@/lib/format";
import { analyticsService } from "@/services/admin/analytics.service";
import type { GroupPerformance, ProductPerformanceRow } from "@/services/admin/analytics.types";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";
import { AnalyticsFiltersBar } from "./AnalyticsFiltersBar";
import { ChartCard, DonutChart, RankBarChart, RevenueBarChart, RevenueOrdersChart } from "./charts";
import { Section } from "./CommandCenter";
import { KpiCard, KpiGrid } from "./KpiCard";
import { useAnalyticsFilters } from "./useAnalyticsFilters";
import { useAnalyticsQuery } from "./useAnalyticsQuery";

type TabKey = "sales" | "products" | "categories" | "brands";

function Growth({ value }: { value: number | null }) {
  if (value === null) return <Typography variant="body2" sx={{ color: "text.secondary" }}>—</Typography>;
  return (
    <Typography variant="body2" sx={{ color: value >= 0 ? "success.main" : "error.main", fontWeight: 600 }}>
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </Typography>
  );
}

function GroupView({ data, label, loading, error, showRating }: { data?: GroupPerformance; label: string; loading: boolean; error: unknown; showRating?: boolean }) {
  const highlights = data ? Object.values(data.highlights).filter(Boolean) : [];
  const withSales = data?.rows.filter((r) => r.units_sold > 0) ?? [];

  return (
    <>
      {highlights.length > 0 && (
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2.5 }}>
          {highlights.map((h) => (
            <Box key={h!.metric} sx={{ flex: 1, p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {h!.metric}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {h!.name}
              </Typography>
              <Typography variant="body2">{typeof h!.value === "number" ? `${h!.value > 0 ? "+" : ""}${h!.value}%` : formatPrice(h!.value)}</Typography>
            </Box>
          ))}
        </Stack>
      )}
      <Section columns={{ lg: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <ChartCard title={`Revenue by ${label}`} loading={loading} error={error} empty={withSales.length === 0}>
          <DonutChart money data={withSales.slice(0, 8).map((r) => ({ label: r.name, value: Number(r.revenue) }))} height={300} />
        </ChartCard>
        <ChartCard title={`Units sold by ${label}`} loading={loading} error={error} empty={withSales.length === 0}>
          <RankBarChart money={false} rows={[...withSales].sort((a, b) => b.units_sold - a.units_sold).slice(0, 10).map((r) => ({ label: r.name, value: r.units_sold }))} />
        </ChartCard>
      </Section>
      <Box sx={{ mt: 2.5 }}>
        <ChartCard title={`${label[0].toUpperCase()}${label.slice(1)} performance`} subtitle="Product sales in the period (excl. shipping); growth vs the previous period" loading={loading} error={error} empty={!data || data.rows.length === 0}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{label[0].toUpperCase() + label.slice(1)}</TableCell>
                  <TableCell align="right">Products</TableCell>
                  <TableCell align="right">Units sold</TableCell>
                  <TableCell align="right">Orders</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Share</TableCell>
                  <TableCell align="right">Growth</TableCell>
                  {showRating && <TableCell align="right">Avg. rating</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell align="right">{r.products}</TableCell>
                    <TableCell align="right">{formatNumber(r.units_sold)}</TableCell>
                    <TableCell align="right">{formatNumber(r.orders)}</TableCell>
                    <TableCell align="right">{formatPrice(r.revenue)}</TableCell>
                    <TableCell align="right">{r.share_pct.toFixed(1)}%</TableCell>
                    <TableCell align="right">
                      <Growth value={r.growth_pct} />
                    </TableCell>
                    {showRating && <TableCell align="right">{r.average_rating !== null ? r.average_rating.toFixed(2) : "—"}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ChartCard>
      </Box>
    </>
  );
}

function ProductPerformance() {
  const { query } = useAnalyticsFilters();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [sort, setSort] = useState("revenue");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const { data, isFetching } = useQuery({
    queryKey: ["admin", "analytics", "products", query, sort, q, paging],
    queryFn: () => analyticsService.products({ ...query, sort, q: q || undefined, ...paging }),
    placeholderData: keepPreviousData,
  });

  const columns: GridColDef<ProductPerformanceRow>[] = [
    {
      field: "name",
      headerName: "Product",
      flex: 2,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Link component={NextLink} href={routes.admin.product(row.id)} sx={{ color: "text.primary", fontWeight: 600 }} noWrap>
            {row.name}
          </Link>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {[row.category, row.brand].filter(Boolean).join(" · ")}
          </Typography>
        </Box>
      ),
    },
    { field: "units_sold", headerName: "Units sold", width: 100, type: "number" },
    { field: "orders", headerName: "Orders", width: 90, type: "number" },
    { field: "revenue", headerName: "Revenue", width: 130, type: "number", valueGetter: (_, row) => Number(row.revenue), valueFormatter: (v) => formatPrice(v) },
    { field: "wishlist_count", headerName: "Wishlisted", width: 100, type: "number" },
    {
      field: "rating",
      headerName: "Rating",
      width: 150,
      renderCell: ({ row }) => (row.reviews > 0 ? <Rating value={row.rating} precision={0.1} size="small" readOnly sx={{ mt: 2.25 }} /> : <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: "60px" }}>No reviews</Typography>),
    },
    { field: "reviews", headerName: "Reviews", width: 90, type: "number" },
    { field: "stock", headerName: "Stock", width: 90, type: "number" },
  ];

  return (
    <Box sx={{ mt: 2.5 }}>
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Search products">
        <TextField select size="small" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="revenue">Revenue</MenuItem>
          <MenuItem value="units">Units sold</MenuItem>
          <MenuItem value="orders">Orders</MenuItem>
          <MenuItem value="rating">Rating</MenuItem>
          <MenuItem value="wishlist">Wishlist saves</MenuItem>
          <MenuItem value="stock">Lowest stock</MenuItem>
        </TextField>
      </ListToolbar>
      <AdminDataGrid rows={data?.data ?? []} columns={columns} loading={isFetching} pagination={data?.pagination} page={paging.page} pageSize={paging.limit} onPageChange={(page, limit) => setPaging({ page, limit })} autoHeight />
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
        Product views and add-to-bag counts aren&apos;t tracked yet, so they are not shown.
      </Typography>
    </Box>
  );
}

/** /admin/analytics — sales trends, products, categories and brands. */
export function SalesAnalytics() {
  const { query } = useAnalyticsFilters();
  const [tab, setTab] = useState<TabKey>("sales");
  const [nonce, setNonce] = useState(0);

  const daily = useAnalyticsQuery("sales-auto", analyticsService.sales, query, nonce);
  const monthly = useAnalyticsQuery("sales-monthly", analyticsService.sales, { ...query, range: "this_year", from: undefined, to: undefined, granularity: "month" }, nonce, { enabled: tab === "sales" });
  const yearly = useAnalyticsQuery("sales-yearly", analyticsService.sales, { ...query, range: "all", from: undefined, to: undefined, granularity: "year" }, nonce, { enabled: tab === "sales" });
  const categories = useAnalyticsQuery("categories", analyticsService.categories, query, nonce, { enabled: tab === "categories" });
  const brands = useAnalyticsQuery("brands", analyticsService.brands, query, nonce, { enabled: tab === "brands" });
  const t = daily.data?.totals;

  return (
    <>
      <PageHeader title="Sales analytics" description="Trends, products, categories and brands. Revenue is net of refunds; cancelled and unpaid orders never count." />
      <AnalyticsFiltersBar applied={daily.data?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={daily.isFetching} />

      {t && (
        <KpiGrid>
          <KpiCard kpi={{ key: "revenue", label: "Revenue", value: t.revenue, previous: t.previous_revenue, change_pct: t.revenue_growth_pct, format: "money", lower_is_better: false, note: null }} />
          <KpiCard kpi={{ key: "orders", label: "Orders", value: t.orders, previous: t.previous_orders, change_pct: t.orders_growth_pct, format: "number", lower_is_better: false, note: null }} />
          <KpiCard kpi={{ key: "aov", label: "Average order value", value: t.aov, previous: null, change_pct: null, format: "money", lower_is_better: false, note: "Revenue ÷ orders" }} />
          <KpiCard kpi={{ key: "units", label: "Units sold", value: t.units, previous: null, change_pct: null, format: "number", lower_is_better: false, note: "Net of cancellations and returns" }} />
        </KpiGrid>
      )}

      <Tabs value={tab} onChange={(_, v: TabKey) => setTab(v)} variant="scrollable" sx={{ mt: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="sales" label="Sales trends" />
        <Tab value="products" label="Products" />
        <Tab value="categories" label="Categories" />
        <Tab value="brands" label="Brands" />
      </Tabs>

      {tab === "sales" && (
        <>
          <Box sx={{ mt: 2.5 }}>
            <ChartCard title="Daily sales" subtitle="Revenue and orders for the selected range" loading={daily.isLoading} error={daily.error} empty={daily.data?.series.every((p) => p.orders === 0)}>
              {daily.data && <RevenueOrdersChart series={daily.data.series} />}
            </ChartCard>
          </Box>
          <Section columns={{ lg: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <ChartCard title="Monthly sales" subtitle="This year, by month" loading={monthly.isLoading} error={monthly.error} empty={monthly.data?.series.every((p) => p.orders === 0)}>
              {monthly.data && <RevenueBarChart series={monthly.data.series} />}
            </ChartCard>
            <ChartCard title="Yearly sales" subtitle="All years with orders" loading={yearly.isLoading} error={yearly.error} empty={yearly.data?.series.every((p) => p.orders === 0)}>
              {yearly.data && <RevenueBarChart series={yearly.data.series} />}
            </ChartCard>
          </Section>
          <Section columns={{ lg: "minmax(0, 1fr)" }}>
            <ChartCard title="Average order value over time" loading={daily.isLoading} empty={daily.data?.series.every((p) => p.orders === 0)}>
              {daily.data && <RevenueBarChart series={daily.data.series.map((p) => ({ period: p.period, revenue: p.aov }))} height={240} />}
            </ChartCard>
          </Section>
        </>
      )}
      {tab === "products" && <ProductPerformance />}
      {tab === "categories" && <GroupView data={categories.data} label="category" loading={categories.isLoading} error={categories.error} />}
      {tab === "brands" && <GroupView data={brands.data} label="brand" loading={brands.isLoading} error={brands.error} showRating />}
    </>
  );
}
