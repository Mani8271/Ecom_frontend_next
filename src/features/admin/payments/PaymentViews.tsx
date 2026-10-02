"use client";

import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { userMessage } from "@/services/api/errors";
import { analyticsService } from "@/services/admin/analytics.service";
import { adminOrdersService, adminPaymentsService } from "@/services/admin/commerce.service";
import type { PaymentRow, RefundRow } from "@/services/admin/commerce.types";
import { AnalyticsFiltersBar } from "../analytics/AnalyticsFiltersBar";
import { ChartCard, DonutChart, RankBarChart } from "../analytics/charts";
import { Section } from "../analytics/CommandCenter";
import { KpiCard, KpiGrid, KpiSkeleton } from "../analytics/KpiCard";
import { useAnalyticsFilters } from "../analytics/useAnalyticsFilters";
import { useAnalyticsQuery } from "../analytics/useAnalyticsQuery";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";

const stat = (key: string, label: string, value: string | number, format: "money" | "number", note: string | null = null) => ({ key, label, value, previous: null, change_pct: null, format, lower_is_better: false, note });

function OrderLink({ id, number }: { id: number; number: string | null }) {
  return (
    <Link component={NextLink} href={routes.admin.order(id)} sx={{ fontWeight: 600, lineHeight: "60px" }}>
      {number}
    </Link>
  );
}

export function PaymentsPanel() {
  const { query } = useAnalyticsFilters();
  const [nonce, setNonce] = useState(0);
  const analytics = useAnalyticsQuery("payments", analyticsService.payments, query, nonce);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [status, setStatus] = useState("");
  const [gateway, setGateway] = useState("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const list = useQuery({
    queryKey: ["admin", "payments", { q, status, gateway, ...paging }],
    queryFn: () => adminPaymentsService.list({ q: q || undefined, status: status || undefined, gateway: gateway || undefined, ...paging }),
    placeholderData: keepPreviousData,
  });
  const t = analytics.data?.totals;

  const columns: GridColDef<PaymentRow>[] = [
    { field: "created_at", headerName: "Date", width: 170, valueGetter: (_, r) => formatDateTime(r.created_at) },
    { field: "order_number", headerName: "Order", width: 110, renderCell: ({ row }) => <OrderLink id={row.order_id} number={row.order_number} /> },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 150 },
    { field: "method", headerName: "Method", width: 140, valueGetter: (_, r) => (r.gateway === "cod" ? "COD" : `${r.gateway}${r.method ? ` · ${r.method.toUpperCase()}` : ""}`) },
    { field: "transaction_id", headerName: "Payment / transaction ID", width: 200, valueGetter: (_, r) => r.transaction_id ?? r.gateway_payment_id ?? "—" },
    { field: "amount", headerName: "Amount", width: 120, type: "number", valueGetter: (_, r) => Number(r.amount), valueFormatter: (v) => formatPrice(v) },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      renderCell: ({ row }) => <Chip size="small" variant="outlined" label={row.status_label} color={row.status === "success" ? "success" : row.status === "failed" ? "error" : row.status === "pending" ? "warning" : "default"} />,
    },
    { field: "failure_reason", headerName: "Failure reason", flex: 1, minWidth: 160 },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Every payment attempt. Orders are only marked paid after server-side verification (or cash collected on delivery)." />
      <AnalyticsFiltersBar applied={analytics.data?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={analytics.isFetching} show={{ payment: true }} />
      <KpiGrid>
        {!t
          ? Array.from({ length: 6 }, (_, i) => <KpiSkeleton key={i} />)
          : [
              stat("paid", "Total collected", t.paid, "money"),
              stat("online", "Online payments", t.online, "money", t.online_success_rate !== null ? `${t.online_success_rate}% success of ${t.online_attempts} attempts` : null),
              stat("cod", "Cash on Delivery", t.cod, "money", "Collected on delivery"),
              stat("pending", "Pending", t.pending_amount, "money", `${t.pending_count} payment(s)`),
              stat("failed", "Failed", t.failed_amount, "money", `${t.failed_count} attempt(s)`),
              stat("refunded", "Refunded", t.refunded, "money", "Refunds completed in period"),
            ].map((k) => <KpiCard key={k.key} kpi={k} />)}
      </KpiGrid>
      <Section columns={{ lg: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <ChartCard title="Payment methods by amount" loading={analytics.isLoading} error={analytics.error} empty={analytics.data?.methods.length === 0}>
          {analytics.data && <DonutChart money data={analytics.data.methods.map((m) => ({ label: m.label, value: Number(m.amount) }))} height={280} />}
        </ChartCard>
        <ChartCard title="Payments by method (count)" loading={analytics.isLoading} error={analytics.error} empty={analytics.data?.methods.length === 0}>
          {analytics.data && <RankBarChart money={false} rows={analytics.data.methods.map((m) => ({ label: m.label, value: m.count }))} />}
        </ChartCard>
      </Section>

      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1.5 }}>
        Payment attempts
      </Typography>
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Order no., payment or transaction ID">
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="success">Paid</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
          <MenuItem value="partially_refunded">Partially refunded</MenuItem>
        </TextField>
        <TextField select size="small" label="Gateway" value={gateway} onChange={(e) => setGateway(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="razorpay">Razorpay</MenuItem>
          <MenuItem value="cod">COD</MenuItem>
        </TextField>
      </ListToolbar>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <AdminDataGrid rows={list.data?.data ?? []} columns={columns} loading={list.isFetching} pagination={list.data?.pagination} page={paging.page} pageSize={paging.limit} onPageChange={(page, limit) => setPaging({ page, limit })} autoHeight />
      )}
    </>
  );
}

const REFUND_STATUS = {
  pending: { label: "Pending", color: "warning" },
  processing: { label: "Processing", color: "info" },
  completed: { label: "Completed", color: "success" },
  failed: { label: "Failed", color: "error" },
} as const;

export function RefundsPanel() {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [status, setStatus] = useState("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [recording, setRecording] = useState<RefundRow | null>(null);
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["admin", "refunds", { q, status, ...paging }],
    queryFn: () => adminPaymentsService.refunds({ q: q || undefined, status: status || undefined, ...paging }),
    placeholderData: keepPreviousData,
  });

  async function record() {
    if (!recording) return;
    setPending(true);
    setError(null);
    try {
      await adminOrdersService.processRefund(recording.id, reference);
      notify.success("Refund marked as completed.");
      setRecording(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  const columns: GridColDef<RefundRow>[] = [
    { field: "reference_number", headerName: "Refund ID", width: 110 },
    { field: "order_number", headerName: "Order", width: 110, renderCell: ({ row }) => <OrderLink id={row.order_id} number={row.order_number} /> },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 150 },
    { field: "amount", headerName: "Amount", width: 120, type: "number", valueGetter: (_, r) => Number(r.amount), valueFormatter: (v) => formatPrice(v) },
    { field: "reason", headerName: "Reason", flex: 1, minWidth: 180 },
    { field: "payment_method", headerName: "Payment", width: 120, valueGetter: (_, r) => (r.gateway === "cod" ? "COD (manual)" : (r.payment_method ?? "").toUpperCase()) },
    { field: "status", headerName: "Status", width: 130, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={REFUND_STATUS[row.status].label} color={REFUND_STATUS[row.status].color} /> },
    { field: "created_at", headerName: "Date", width: 170, valueGetter: (_, r) => formatDateTime(r.processed_at ?? r.created_at) },
    {
      field: "actions",
      headerName: "",
      width: 150,
      renderCell: ({ row }) =>
        row.status === "pending" && row.manual && hasPermission("orders.refund") ? (
          <Button size="small" onClick={() => (setRecording(row), setReference(""), setError(null))}>
            Record transfer
          </Button>
        ) : row.reference ? (
          <Typography variant="caption" sx={{ lineHeight: "60px" }}>
            Ref {row.reference}
          </Typography>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Refunds" description="Online refunds go back through the payment gateway automatically; cash (COD) refunds are paid by bank/UPI transfer and recorded here." />
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Order no. or customer">
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          {Object.entries(REFUND_STATUS).map(([value, s]) => (
            <MenuItem key={value} value={value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
      </ListToolbar>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <AdminDataGrid rows={list.data?.data ?? []} columns={columns} loading={list.isFetching} pagination={list.data?.pagination} page={paging.page} pageSize={paging.limit} onPageChange={(page, limit) => setPaging({ page, limit })} autoHeight />
      )}
      <Dialog open={Boolean(recording)} onClose={pending ? undefined : () => setRecording(null)} fullWidth maxWidth="xs">
        <DialogTitle>Record refund transfer</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            {recording && `${formatPrice(recording.amount)} to ${recording.customer} for order ${recording.order_number}.`}
          </Typography>
          <TextField label="Bank / UPI reference" required value={reference} onChange={(e) => setReference(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRecording(null)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={record} loading={pending} disabled={!reference.trim()}>
            Mark completed
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
