"use client";

import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { routes } from "@/config/routes";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { reportsService } from "@/services/admin/analytics.service";
import type { ReportColumn } from "@/services/admin/analytics.types";
import { AnalyticsFiltersBar } from "../analytics/AnalyticsFiltersBar";
import { useAnalyticsFilters } from "../analytics/useAnalyticsFilters";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { REPORTS } from "./report-list";
import { ListToolbar } from "../components/ListToolbar";



const SORT_LABELS: Record<string, string> = {
  date: "Date",
  total: "Total",
  order_number: "Order",
  period: "Period",
  net: "Net revenue",
  orders: "Orders",
  revenue: "Revenue",
  units: "Units",
  rating: "Rating",
  stock: "Stock",
  product: "Product",
  available: "Available",
  sold: "Sold",
  value: "Value",
  sku: "SKU",
  spent: "Spent",
  joined: "Customer since",
  name: "Name",
  last_order: "Last order",
  amount: "Amount",
  uses: "Uses",
  discount: "Discount",
  code: "Code",
  tax: "GST",
};

function formatCell(value: string | number | null | undefined, type: ReportColumn["type"]): string {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "money") return formatPrice(value);
  if (type === "number") return typeof value === "number" ? formatNumber(value) : String(value);
  if (type === "datetime") return formatDateTime(String(value));
  if (type === "date") return new Date(String(value)).toLocaleDateString("en-IN");
  return String(value);
}

export function ReportsIndex() {
  return (
    <>
      <PageHeader title="Reports" description="Pick a report. Every report supports a date range, filters, search, sorting, CSV export (opens in Excel) and printing." />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
        {REPORTS.map((r) => (
          <Box
            key={r.type}
            component={NextLink}
            href={routes.admin.report(r.type)}
            sx={{ p: 2.5, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4, textDecoration: "none", color: "inherit", "&:hover": { boxShadow: 2, borderColor: "primary.main" } }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
              <AssessmentOutlinedIcon sx={{ color: "primary.dark" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {r.title}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {r.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

export function ReportView({ type }: { type: string }) {
  const notify = useNotify();
  const { query } = useAnalyticsFilters();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [paging, setPaging] = useState({ page: 1, limit: 50 });
  const [nonce, setNonce] = useState(0);
  const [exporting, setExporting] = useState(false);
  const info = REPORTS.find((r) => r.type === type);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "reports", type, query, q, sort, paging, nonce],
    queryFn: () => reportsService.get(type, { ...query, q: q || undefined, sort, ...paging }),
    placeholderData: keepPreviousData,
  });
  const meta = data?.meta;
  const currentSort = sort ?? meta?.sort ?? "";

  const columns: GridColDef<Record<string, string | number | null> & { __id: number }>[] = (meta?.columns ?? []).map((c) => ({
    field: c.key,
    headerName: c.label,
    minWidth: c.type === "text" ? 150 : 115,
    flex: c.type === "text" ? 1 : undefined,
    type: c.type === "money" || c.type === "number" ? "number" : "string",
    valueGetter: (_, row) => (c.type === "money" ? Number(row[c.key] ?? 0) : row[c.key]),
    valueFormatter: (_v, row) => formatCell(row[c.key], c.type),
  }));
  const rows = (data?.data ?? []).map((row, i) => ({ ...row, __id: (paging.page - 1) * paging.limit + i }));

  async function exportCsv() {
    setExporting(true);
    try {
      await reportsService.download(type, { ...query, q: q || undefined, sort: currentSort || undefined });
    } catch (err) {
      notify.error(err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={meta?.title ?? info?.title ?? "Report"}
        description={info?.description}
        action={
          <Stack direction="row" spacing={1} sx={{ displayPrint: "none" }}>
            <Button variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportCsv} loading={exporting}>
              Export CSV
            </Button>
          </Stack>
        }
      />
      <Box sx={{ displayPrint: "none" }}>
        <AnalyticsFiltersBar applied={meta?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={isFetching} />
        <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Search this report">
          {meta && meta.sorts.length > 0 && (
            <>
              <TextField select size="small" label="Sort by" value={currentSort.replace(/^-/, "")} onChange={(e) => setSort(`${currentSort.startsWith("-") ? "-" : ""}${e.target.value}`)} sx={{ minWidth: 160 }}>
                {meta.sorts.map((s) => (
                  <MenuItem key={s} value={s}>
                    {SORT_LABELS[s] ?? s}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Order" value={currentSort.startsWith("-") ? "desc" : "asc"} onChange={(e) => setSort(`${e.target.value === "desc" ? "-" : ""}${currentSort.replace(/^-/, "")}`)} sx={{ minWidth: 130 }}>
                <MenuItem value="desc">High → low</MenuItem>
                <MenuItem value="asc">Low → high</MenuItem>
              </TextField>
            </>
          )}
        </ListToolbar>
      </Box>

      {meta?.filters && (
        <Typography variant="caption" sx={{ display: "none", displayPrint: "block", mb: 1 }}>
          Period: {meta.filters.from} to {meta.filters.to} (IST)
        </Typography>
      )}

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <AdminDataGrid
          getRowId={(row) => row.__id}
          rows={rows}
          columns={columns}
          loading={isFetching}
          pagination={data?.pagination}
          page={paging.page}
          pageSize={paging.limit}
          onPageChange={(page, limit) => setPaging({ page, limit })}
          rowHeight={44}
          autoHeight
        />
      )}

      {meta?.totals && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 3 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Totals for all {formatNumber(data?.pagination.total ?? 0)} rows
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 3, mt: 0.5 }}>
            {meta.columns
              .filter((c) => meta.totals && c.key in meta.totals)
              .map((c) => (
                <Box key={c.key}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {c.label}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {formatCell(meta.totals![c.key], c.type)}
                  </Typography>
                </Box>
              ))}
          </Stack>
          {meta.totals_note && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {meta.totals_note}
            </Typography>
          )}
        </Box>
      )}
    </>
  );
}
