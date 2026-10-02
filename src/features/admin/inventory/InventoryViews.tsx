"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { analyticsService, inventoryService } from "@/services/admin/analytics.service";
import type { StockMovement } from "@/services/admin/analytics.types";
import { AnalyticsFiltersBar } from "../analytics/AnalyticsFiltersBar";
import { ChartCard } from "../analytics/charts";
import { Section } from "../analytics/CommandCenter";
import { KpiCard, KpiGrid, KpiSkeleton } from "../analytics/KpiCard";
import { useAnalyticsFilters } from "../analytics/useAnalyticsFilters";
import { useAnalyticsQuery } from "../analytics/useAnalyticsQuery";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";
import { InventoryTable } from "./InventoryTable";

const stat = (key: string, label: string, value: string | number, format: "money" | "number" = "number", note: string | null = null) => ({
  key,
  label,
  value,
  previous: null,
  change_pct: null,
  format,
  lower_is_better: false,
  note,
});

function MiniTable({ rows, columns }: { rows: Record<string, string | number | null>[]; columns: [string, string, boolean?][] }) {
  if (rows.length === 0) return <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>Nothing to show for this period.</Typography>;
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map(([key, label, right]) => (
            <TableCell key={key} align={right ? "right" : "left"}>
              {label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {columns.map(([key, , right]) => (
              <TableCell key={key} align={right ? "right" : "left"} sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row[key] ?? "—"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** /admin/inventory — stock position, movers and the full variant table. */
export function InventoryDashboard() {
  const { query } = useAnalyticsFilters();
  const [nonce, setNonce] = useState(0);
  const { data, isLoading, error, isFetching } = useAnalyticsQuery("inventory", analyticsService.inventory, query, nonce);
  const t = data?.totals;

  return (
    <>
      <PageHeader title="Inventory" description="Stock is tracked per variant (size/colour). Every change is recorded in stock history." />
      <AnalyticsFiltersBar applied={data?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={isFetching} show={{ category: true, brand: true }} />
      <KpiGrid>
        {!t
          ? Array.from({ length: 6 }, (_, i) => <KpiSkeleton key={i} />)
          : [
              stat("skus", "Total SKUs", t.skus),
              stat("units", "Units on hand", t.units, "number", `${formatNumber(t.reserved)} reserved`),
              stat("value", "Inventory value", t.value_at_price, "money", "At selling price"),
              t.value_at_cost !== null ? stat("cost", "Inventory at cost", t.value_at_cost, "money") : stat("cost", "Inventory at cost", "—", "number", `${t.variants_missing_cost} variants have no cost price`),
              stat("low", "Low stock", t.low_stock),
              stat("out", "Out of stock", t.out_of_stock, "number", `${t.discontinued} discontinued`),
            ].map((k) => <KpiCard key={k.key} kpi={k} />)}
      </KpiGrid>
      <Section columns={{ lg: "repeat(3, minmax(0, 1fr))" }}>
        <ChartCard title="Fast moving" subtitle="Most units sold in the period" loading={isLoading} error={error} height={200}>
          {data && <MiniTable rows={data.fast_moving.map((r) => ({ product: r.product, sku: r.sku, sold: r.units_sold, left: r.available }))} columns={[["product", "Product"], ["sold", "Sold", true], ["left", "Left", true]]} />}
        </ChartCard>
        <ChartCard title="Slow moving" subtitle="In stock, fewest sales in the period" loading={isLoading} error={error} height={200}>
          {data && <MiniTable rows={data.slow_moving.map((r) => ({ product: r.product, sold: r.units_sold, left: r.available }))} columns={[["product", "Product"], ["sold", "Sold", true], ["left", "In stock", true]]} />}
        </ChartCard>
        <ChartCard title="Recently restocked" loading={isLoading} error={error} height={200}>
          {data && <MiniTable rows={data.recently_restocked.map((r) => ({ product: r.product, added: `+${r.added}`, when: formatDateTime(r.at) }))} columns={[["product", "Product"], ["added", "Added", true], ["when", "When"]]} />}
        </ChartCard>
      </Section>
      <Box sx={{ mt: 3 }}>
        <InventoryTable />
      </Box>
    </>
  );
}

export function LowStockView() {
  return (
    <>
      <PageHeader title="Low stock" description="Sellable variants at or below their reorder level. Suggested reorder brings stock back to twice the threshold." />
      <InventoryTable mode="low" />
    </>
  );
}

export function OutOfStockView() {
  return (
    <>
      <PageHeader title="Out of stock" description="Sellable variants with no available units. Restock, deactivate the product, or check its stock history." />
      <InventoryTable mode="out" />
    </>
  );
}

/** /admin/inventory/history — every stock movement, filterable. */
export function StockHistoryView() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = useDebouncedValue(search.trim());
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paging, setPaging] = useState({ page: 1, limit: 50 });
  const query = { ...paging, q: q || undefined, type: type || undefined, from: from || undefined, to: to || undefined };
  const { data, isFetching, error, refetch } = useQuery({ queryKey: ["admin", "inventory", "history", query], queryFn: () => inventoryService.history(query), placeholderData: keepPreviousData });
  const types = data?.meta?.types ?? {};
  const reset = () => setPaging((p) => ({ ...p, page: 1 }));

  const columns: GridColDef<StockMovement>[] = [
    { field: "at", headerName: "Date", width: 170, valueGetter: (_, r) => formatDateTime(r.at) },
    {
      field: "product",
      headerName: "Product",
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.product ?? "Deleted product"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {row.sku}
            {row.variant_title ? ` · ${row.variant_title}` : ""}
          </Typography>
        </Box>
      ),
    },
    { field: "action", headerName: "Action", width: 170, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={row.action} color={row.change > 0 ? "success" : row.change < 0 ? "warning" : "default"} /> },
    { field: "previous_stock", headerName: "Previous", width: 90, type: "number" },
    {
      field: "change",
      headerName: "Change",
      width: 90,
      type: "number",
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ lineHeight: "60px", fontWeight: 700, color: row.change > 0 ? "success.main" : row.change < 0 ? "error.main" : "text.secondary" }}>
          {row.change > 0 ? "+" : ""}
          {row.change}
        </Typography>
      ),
    },
    { field: "new_stock", headerName: "New stock", width: 95, type: "number" },
    { field: "reason", headerName: "Reason", flex: 1, minWidth: 160 },
    { field: "admin", headerName: "By", width: 140, valueGetter: (_, r) => r.admin ?? "System" },
  ];

  return (
    <>
      <PageHeader title="Stock history" description="Every stock change with before/after quantities, reason and who made it. Nothing changes silently." />
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), reset())} placeholder="Product name or SKU">
        <TextField select size="small" label="Action" value={type} onChange={(e) => (setType(e.target.value), reset())} sx={{ minWidth: 180 }}>
          <MenuItem value="">All (excl. reservations)</MenuItem>
          {Object.entries(types).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="date" label="From" value={from} onChange={(e) => (setFrom(e.target.value), reset())} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="date" label="To" value={to} onChange={(e) => (setTo(e.target.value), reset())} slotProps={{ inputLabel: { shrink: true } }} />
      </ListToolbar>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <AdminDataGrid rows={data?.data ?? []} columns={columns} loading={isFetching} pagination={data?.pagination} page={paging.page} pageSize={paging.limit} onPageChange={(page, limit) => setPaging({ page, limit })} autoHeight />
      )}
    </>
  );
}
