"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { OrderStatusChip } from "@/features/orders/components/OrderStatusChip";
import { formatAddressLines, formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { analyticsService } from "@/services/admin/analytics.service";
import { adminCustomersService } from "@/services/admin/commerce.service";
import type { CustomerRow } from "@/services/admin/commerce.types";
import { AnalyticsFiltersBar } from "../analytics/AnalyticsFiltersBar";
import { ChartCard, RevenueBarChart } from "../analytics/charts";
import { Section } from "../analytics/CommandCenter";
import { KpiCard, KpiGrid, KpiSkeleton } from "../analytics/KpiCard";
import { useAnalyticsFilters } from "../analytics/useAnalyticsFilters";
import { useAnalyticsQuery } from "../analytics/useAnalyticsQuery";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";

export function CustomersPanel() {
  const router = useRouter();
  const { query } = useAnalyticsFilters();
  const [nonce, setNonce] = useState(0);
  const analytics = useAnalyticsQuery("customers", analyticsService.customers, query, nonce);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const list = useQuery({
    queryKey: ["admin", "customers", { q, status, sort, ...paging }],
    queryFn: () => adminCustomersService.list({ q: q || undefined, status: status || undefined, sort, ...paging }),
    placeholderData: keepPreviousData,
  });
  const t = analytics.data?.totals;

  const kpi = (key: string, label: string, value: string | number, previous: number | null = null, format: "money" | "number" = "number", note: string | null = null) => ({
    key,
    label,
    value,
    previous,
    change_pct: previous ? Math.round(((Number(value) - previous) / previous) * 1000) / 10 : null,
    format,
    lower_is_better: false,
    note,
  });

  const columns: GridColDef<CustomerRow>[] = [
    {
      field: "name",
      headerName: "Customer",
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {row.email}
          </Typography>
        </Box>
      ),
    },
    { field: "phone", headerName: "Phone", width: 150 },
    { field: "orders_count", headerName: "Orders", width: 90, type: "number" },
    { field: "total_spent", headerName: "Total spent", width: 130, type: "number", valueGetter: (_, r) => Number(r.total_spent), valueFormatter: (v) => formatPrice(v) },
    { field: "aov", headerName: "Avg. order", width: 120, type: "number", valueGetter: (_, r) => (r.orders_count ? Number(r.total_spent) / r.orders_count : 0), valueFormatter: (v) => formatPrice(v) },
    { field: "created_at", headerName: "Customer since", width: 170, valueGetter: (_, r) => formatDateTime(r.created_at) },
    { field: "status", headerName: "Status", width: 110, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={row.status === "active" ? "Active" : "Blocked"} color={row.status === "active" ? "success" : "error"} /> },
  ];

  return (
    <>
      <PageHeader title="Customers" description="Registered customers, their orders and spending. Guest orders are counted separately." />
      <AnalyticsFiltersBar applied={analytics.data?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={analytics.isFetching} show={{ payment: true }} />
      <KpiGrid>
        {!t
          ? Array.from({ length: 6 }, (_, i) => <KpiSkeleton key={i} />)
          : [
              kpi("total", "Total customers", t.total, null, "number", "All registered"),
              kpi("new", "New customers", t.new, t.new_previous, "number"),
              kpi("active", "Active customers", t.active, t.active_previous, "number"),
              kpi("repeat", "Repeat customers", t.repeat, null, "number", "Active in period, 2+ orders ever"),
              kpi("guest", "Guest orders", t.guest_orders),
              kpi("spend", "Avg. spend per customer", t.average_spend, null, "money", `${formatPrice(t.customer_revenue)} total`),
            ].map((k) => <KpiCard key={k.key} kpi={k} />)}
      </KpiGrid>
      <Section columns={{ lg: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <ChartCard title="Customer growth" subtitle="New sign-ups" loading={analytics.isLoading} error={analytics.error} empty={analytics.data?.growth.every((g) => g.new_customers === 0)}>
          {analytics.data && <RevenueBarChart series={analytics.data.growth.map((g) => ({ period: g.period, revenue: String(g.new_customers) }))} />}
        </ChartCard>
        <ChartCard title="Top customers" subtitle="By spend in the period" loading={analytics.isLoading} error={analytics.error} empty={analytics.data?.top_customers.length === 0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Spent</TableCell>
                <TableCell align="right">AOV</TableCell>
                <TableCell>Last order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.data?.top_customers.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Link component={NextLink} href={routes.admin.customer(c.id)} sx={{ color: "text.primary", fontWeight: 600 }}>
                      {c.name}
                    </Link>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      since {new Date(c.customer_since).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{c.orders}</TableCell>
                  <TableCell align="right">{formatPrice(c.total_spent)}</TableCell>
                  <TableCell align="right">{formatPrice(c.aov)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(c.last_order_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartCard>
      </Section>

      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1.5 }}>
        All customers
      </Typography>
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Name, email or phone">
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </TextField>
        <TextField select size="small" label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="newest">Newest</MenuItem>
          <MenuItem value="spent">Highest spend</MenuItem>
          <MenuItem value="orders">Most orders</MenuItem>
          <MenuItem value="oldest">Oldest</MenuItem>
        </TextField>
      </ListToolbar>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <AdminDataGrid
          rows={list.data?.data ?? []}
          columns={columns}
          loading={list.isFetching}
          pagination={list.data?.pagination}
          page={paging.page}
          pageSize={paging.limit}
          onPageChange={(page, limit) => setPaging({ page, limit })}
          onRowClick={({ row }) => router.push(routes.admin.customer(row.id))}
          autoHeight
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      )}
    </>
  );
}

export function CustomerDetailView({ customerId }: { customerId: number }) {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const { data: c, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "customers", "detail", customerId], queryFn: () => adminCustomersService.get(customerId) });

  if (isLoading) return <PageSkeleton />;
  if (error || !c) return <ErrorState error={error} onRetry={() => refetch()} />;

  async function toggleBlock() {
    setPending(true);
    try {
      await adminCustomersService.setStatus(c!.id, c!.status === "active" ? "blocked" : "active");
      notify.success(c!.status === "active" ? "Customer blocked and signed out." : "Customer unblocked.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
      setConfirm(false);
    }
  }

  const box = { p: 2.5, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 };

  return (
    <>
      <LinkButton href={routes.admin.customers} startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>
        Customers
      </LinkButton>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h4" component="h1">
              {c.name}
            </Typography>
            <Chip size="small" variant="outlined" label={c.status === "active" ? "Active" : "Blocked"} color={c.status === "active" ? "success" : "error"} />
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {c.email} {c.email_verified ? "✓" : "(unverified)"} · {c.phone ?? "no phone"} {c.phone && (c.phone_verified ? "✓" : "(unverified)")}
          </Typography>
        </Box>
        {hasPermission("customers.update") && (
          <Button variant="outlined" color={c.status === "active" ? "error" : "primary"} onClick={() => setConfirm(true)}>
            {c.status === "active" ? "Block customer" : "Unblock customer"}
          </Button>
        )}
      </Stack>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, mb: 3 }}>
        {[
          ["Orders", formatNumber(c.orders_count)],
          ["Total spent", formatPrice(c.total_spent)],
          ["Avg. order value", formatPrice(c.orders_count ? Number(c.total_spent) / c.orders_count : 0)],
          ["Reviews", formatNumber(c.reviews_count)],
          ["Wishlist", formatNumber(c.wishlist_count)],
        ].map(([label, value]) => (
          <Box key={label} sx={box}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {label}
            </Typography>
            <Typography variant="h6">{value}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { lg: "minmax(0, 2fr) minmax(0, 1fr)" }, alignItems: "start" }}>
        <Box sx={box}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Recent orders
          </Typography>
          {c.recent_orders.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No orders yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {c.recent_orders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <Link component={NextLink} href={routes.admin.order(o.id)} sx={{ fontWeight: 600 }}>
                        {o.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDateTime(o.placed_at)}</TableCell>
                    <TableCell align="right">{formatPrice(o.grand_total)}</TableCell>
                    <TableCell>
                      <OrderStatusChip status={o.status} label={o.status_label} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
        <Stack spacing={2.5}>
          <Box sx={box}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Details
            </Typography>
            <Typography variant="body2">Customer since {formatDateTime(c.created_at)}</Typography>
            <Typography variant="body2">Last login {formatDateTime(c.last_login_at)}</Typography>
            {c.date_of_birth && <Typography variant="body2">Birthday {c.date_of_birth}</Typography>}
          </Box>
          <Box sx={box}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Addresses ({c.addresses.length})
            </Typography>
            <Stack spacing={1.5}>
              {c.addresses.map((a) => (
                <Box key={a.id}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {a.name} {a.is_default && <Chip size="small" label="Default" sx={{ ml: 0.5 }} />}
                  </Typography>
                  {formatAddressLines(a).map((l) => (
                    <Typography key={l} variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {l}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
      {c.status === "blocked" && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Blocked customers can&apos;t sign in or place orders.
        </Alert>
      )}
      <ConfirmDialog
        open={confirm}
        title={c.status === "active" ? `Block ${c.name}?` : `Unblock ${c.name}?`}
        description={c.status === "active" ? "They will be signed out everywhere and won't be able to sign in until unblocked." : undefined}
        confirmLabel={c.status === "active" ? "Block" : "Unblock"}
        destructive={c.status === "active"}
        pending={pending}
        onConfirm={toggleBlock}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}
