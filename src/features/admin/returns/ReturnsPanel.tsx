"use client";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { userMessage } from "@/services/api/errors";
import { adminReturnsService } from "@/services/admin/commerce.service";
import type { AdminReturnRow } from "@/services/admin/commerce.types";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";

const STATUSES = ["requested", "approved", "rejected", "pickup_scheduled", "picked_up", "received", "refund_initiated", "refunded"] as const;
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
const color = (s: string) => (s === "requested" ? "warning" : s === "rejected" ? "default" : s === "refunded" ? "success" : "info");

function ReturnDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data: r, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "returns", "detail", id], queryFn: () => adminReturnsService.get(id) });
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function act(key: string, action: () => Promise<unknown>, message: string) {
    setPending(key);
    setFormError(null);
    try {
      await action();
      notify.success(message);
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
    } catch (err) {
      setFormError(userMessage(err));
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Return {r?.rma_number}
        {r && <Chip size="small" sx={{ ml: 1 }} label={r.status_label} color={color(r.status)} variant="outlined" />}
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <FormSkeleton fields={3} />
        ) : error || !r ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <Stack spacing={2}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Typography variant="body2">
              Order{" "}
              <Link component={NextLink} href={routes.admin.order(r.order_id)} sx={{ fontWeight: 600 }}>
                {r.order_number}
              </Link>{" "}
              · {r.customer.name} · {r.customer.phone}
            </Typography>
            <Box>
              <Typography variant="subtitle2">{r.reason}</Typography>
              {r.description && (
                <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
                  {r.description}
                </Typography>
              )}
            </Box>
            <Stack spacing={1}>
              {r.items.map((i) => (
                <Stack key={i.order_item_id} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar variant="rounded" src={i.image ?? undefined} sx={{ width: 40, height: 52 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {i.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {i.variant_title} · Qty {i.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{formatPrice(i.refund_amount)}</Typography>
                </Stack>
              ))}
            </Stack>
            {r.photos.length > 0 && (
              <Stack direction="row" spacing={1}>
                {r.photos.map((p, i) => (
                  <a key={i} href={p.lg ?? undefined} target="_blank" rel="noopener noreferrer">
                    <Avatar variant="rounded" src={p.thumb ?? undefined} sx={{ width: 64, height: 64 }} />
                  </a>
                ))}
              </Stack>
            )}
            <Typography variant="body2">
              Refund amount: <strong>{formatPrice(r.refund_amount)}</strong>
              {r.refund && ` · refund ${r.refund.status}${r.refund.reference ? ` (ref ${r.refund.reference})` : ""}`}
            </Typography>
            <Divider />
            <Stack spacing={0.5}>
              {r.timeline.map((t) => (
                <Typography key={t.label} variant="caption" sx={{ color: "text.secondary" }}>
                  {t.label}: {formatDateTime(t.at)}
                </Typography>
              ))}
            </Stack>
            {hasPermission("returns.update") && r.next_statuses.length > 0 && (
              <>
                <TextField size="small" label="Note to customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {r.next_statuses.map((s) => (
                    <Button
                      key={s.value}
                      variant={s.value === "rejected" ? "outlined" : "contained"}
                      color={s.value === "rejected" ? "error" : "primary"}
                      loading={pending === s.value}
                      disabled={pending !== null}
                      onClick={() => act(s.value, () => adminReturnsService.updateStatus(r.id, s.value, note || undefined), `Return ${s.label.toLowerCase()}.`)}
                    >
                      {s.value === "approved" ? "Approve" : s.value === "rejected" ? "Reject" : s.value === "pickup_scheduled" ? "Schedule pickup" : s.value === "picked_up" ? "Mark picked up" : s.value === "received" ? "Mark received (restock)" : s.label}
                    </Button>
                  ))}
                </Stack>
              </>
            )}
            {hasPermission("orders.refund") && r.can_refund && (
              <Stack spacing={1}>
                <TextField size="small" label="Bank / UPI reference (cash orders only)" value={reference} onChange={(e) => setReference(e.target.value)} helperText="Online payments are refunded through the gateway automatically." />
                <Button variant="contained" color="success" loading={pending === "refund"} disabled={pending !== null} onClick={() => act("refund", () => adminReturnsService.refund(r.id, { reference: reference || undefined }), "Refund initiated.")}>
                  Refund {formatPrice(r.refund_amount)}
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReturnsPanel() {
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [status, setStatus] = useState("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [open, setOpen] = useState<number | null>(null);
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "returns", { q, status, ...paging }],
    queryFn: () => adminReturnsService.list({ q: q || undefined, status: status || undefined, ...paging }),
    placeholderData: keepPreviousData,
  });

  const columns: GridColDef<AdminReturnRow>[] = [
    { field: "rma_number", headerName: "Return ID", width: 110 },
    { field: "order_number", headerName: "Order", width: 110 },
    { field: "customer_name", headerName: "Customer", flex: 1, minWidth: 150 },
    { field: "reason", headerName: "Reason", flex: 1, minWidth: 180 },
    { field: "item_count", headerName: "Items", width: 70, type: "number" },
    { field: "status", headerName: "Status", width: 150, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={row.status_label} color={color(row.status)} /> },
    { field: "requested_at", headerName: "Requested", width: 170, valueGetter: (_, r) => formatDateTime(r.requested_at) },
    { field: "refund_amount", headerName: "Refund", width: 110, type: "number", valueGetter: (_, r) => Number(r.refund_amount), valueFormatter: (v) => formatPrice(v) },
  ];

  return (
    <>
      <PageHeader title="Returns" description="Approve or reject, schedule pickup, mark received (stock is added back), then refund." />
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Return ID or order no.">
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="">All</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {label(s)}
            </MenuItem>
          ))}
        </TextField>
      </ListToolbar>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <AdminDataGrid
          rows={data?.data ?? []}
          columns={columns}
          loading={isFetching}
          pagination={data?.pagination}
          page={paging.page}
          pageSize={paging.limit}
          onPageChange={(page, limit) => setPaging({ page, limit })}
          onRowClick={({ row }) => setOpen(row.id)}
          autoHeight
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      )}
      {open !== null && <ReturnDialog id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
