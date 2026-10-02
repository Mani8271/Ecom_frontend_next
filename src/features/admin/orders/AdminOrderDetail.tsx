"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState, type ReactNode } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { OrderStatusChip } from "@/features/orders/components/OrderStatusChip";
import { TrackingTimeline } from "@/features/orders/components/TrackingTimeline";
import { formatAddressLines, formatDateTime, formatPrice } from "@/lib/format";
import { userMessage } from "@/services/api/errors";
import { adminOrdersService } from "@/services/admin/commerce.service";
import type { AdminOrder } from "@/services/admin/commerce.types";

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, py: 0.25 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500, textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

type DialogKind = "status" | "shipment" | "cancel" | "refund" | { processRefund: number } | null;

export function AdminOrderDetail({ orderId }: { orderId: number }) {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const key = ["admin", "orders", "detail", orderId];
  const { data: order, isLoading, error, refetch } = useQuery({ queryKey: key, queryFn: () => adminOrdersService.get(orderId) });
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;
  if (error || !order) return <ErrorState error={error} onRetry={() => refetch()} />;

  const open = (kind: DialogKind, initial: Record<string, string | boolean> = {}) => {
    setForm(initial);
    setFormError(null);
    setDialog(kind);
  };

  async function run(action: () => Promise<AdminOrder>, message: string) {
    setPending(true);
    setFormError(null);
    try {
      const next = await action();
      queryClient.setQueryData(key, next);
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
      setDialog(null);
      notify.success(message);
    } catch (err) {
      setFormError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  const canUpdate = hasPermission("orders.update");
  const canCancel = hasPermission("orders.cancel") && order.next_statuses.some((s) => s.value === "cancelled");
  const canRefund = hasPermission("orders.refund") && Number(order.refundable_amount) > 0 && order.payment_status !== "pending" && order.payment_status !== "failed";
  const s = (k: string) => (typeof form[k] === "string" ? (form[k] as string) : "");

  return (
    <>
      <LinkButton href={routes.admin.orders} startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1, ml: -1 }}>
        Orders
      </LinkButton>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h4" component="h1">
              {order.order_number}
            </Typography>
            <OrderStatusChip status={order.status} label={order.status_label} />
            {order.is_guest && <Chip size="small" label="Guest" variant="outlined" />}
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Placed {formatDateTime(order.placed_at)} · {order.item_count} item(s) · {formatPrice(order.grand_total)} · {order.payment_method_label} ({order.payment_status_label})
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {canUpdate && order.next_statuses.some((st) => st.value !== "cancelled") && (
            <Button variant="contained" onClick={() => open("status", { status: order.next_statuses.find((st) => st.value !== "cancelled")?.value ?? "" })}>
              Update status
            </Button>
          )}
          {canUpdate && !["cancelled", "refunded", "payment_pending"].includes(order.status) && (
            <Button variant="outlined" onClick={() => open("shipment", { carrier: order.shipment?.carrier ?? "", tracking_number: order.shipment?.tracking_number ?? "", tracking_url: order.shipment?.tracking_url ?? "", expected_delivery_date: order.expected_delivery_date ?? "", mark_shipped: order.next_statuses.some((st) => st.value === "shipped") })}>
              {order.shipment ? "Edit tracking" : "Add tracking"}
            </Button>
          )}
          {canRefund && (
            <Button variant="outlined" onClick={() => open("refund", { amount: order.refundable_amount, reason: "" })}>
              Refund
            </Button>
          )}
          {canCancel && (
            <Button variant="outlined" color="error" onClick={() => open("cancel", { reason: "" })}>
              Cancel order
            </Button>
          )}
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { lg: "minmax(0, 1.4fr) minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
        <Stack spacing={2.5}>
          <Panel title="Items">
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" spacing={1.5}>
                  <Box component="img" src={item.image ?? undefined} alt="" sx={{ width: 56, height: 72, objectFit: "cover", borderRadius: 1.5, bgcolor: "action.hover", flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {item.product_id ? (
                      <Link component={NextLink} href={routes.admin.product(item.product_id)} variant="subtitle2" sx={{ color: "text.primary" }}>
                        {item.name}
                      </Link>
                    ) : (
                      <Typography variant="subtitle2">{item.name}</Typography>
                    )}
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      SKU {item.sku} · {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </Typography>
                    <Typography variant="body2">
                      {item.quantity} × {formatPrice(item.unit_price)} {Number(item.discount_amount) > 0 && `− coupon ${formatPrice(item.discount_amount)}`} = <strong>{formatPrice(item.line_total)}</strong>
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip size="small" variant="outlined" label={`GST ${Number(item.tax_rate)}%`} />
                      {item.qty_cancelled > 0 && <Chip size="small" label={`${item.qty_cancelled} cancelled`} />}
                      {item.qty_returned > 0 && <Chip size="small" label={`${item.qty_returned} returned`} />}
                    </Stack>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Panel>

          <Panel title="Tracking & history">
            {order.shipment && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {order.shipment.carrier}
                {order.shipment.tracking_number ? ` · ${order.shipment.tracking_number}` : ""}
                {order.shipment.tracking_url && (
                  <>
                    {" · "}
                    <Link href={order.shipment.tracking_url} target="_blank" rel="noopener noreferrer">
                      courier page
                    </Link>
                  </>
                )}
              </Alert>
            )}
            <TrackingTimeline tracking={{ ...order.tracking, events: [] }} />
            <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mt: 2 }}>
              Status history
            </Typography>
            <Stack spacing={1}>
              {order.history.map((h, i) => (
                <Stack key={i} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {h.label} {!h.visible_to_customer && <Chip size="small" label="internal" sx={{ ml: 0.5 }} />}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {[h.comment, h.actor ? `by ${h.actor}` : null].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    {formatDateTime(h.at)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Stack>

        <Stack spacing={2.5}>
          <Panel title="Customer">
            <Typography variant="subtitle2">{order.customer.name}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {order.customer.email} · {order.customer.phone}
            </Typography>
            {order.user && (
              <Link component={NextLink} href={routes.admin.customer(order.user.id)} variant="body2">
                View customer profile
              </Link>
            )}
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Ship to
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {order.shipping_address.name} · {order.shipping_address.phone}
            </Typography>
            {formatAddressLines(order.shipping_address).map((l) => (
              <Typography key={l} variant="body2" sx={{ color: "text.secondary" }}>
                {l}
              </Typography>
            ))}
          </Panel>

          <Panel title="Amounts">
            <Line label="Total MRP" value={formatPrice(order.totals.mrp_total)} />
            <Line label="Product discount" value={`− ${formatPrice(order.totals.product_discount)}`} />
            <Line label={`Coupon${order.totals.coupon_code ? ` (${order.totals.coupon_code})` : ""}`} value={`− ${formatPrice(order.totals.coupon_discount)}`} />
            <Line label="Shipping" value={formatPrice(order.totals.shipping)} />
            {Number(order.totals.cod_fee) > 0 && <Line label="COD fee" value={formatPrice(order.totals.cod_fee)} />}
            <Divider sx={{ my: 1 }} />
            <Line label="Grand total" value={<strong>{formatPrice(order.totals.grand_total)}</strong>} />
            <Line label="GST included" value={formatPrice(order.totals.tax_included)} />
            <Line label="Refunded" value={formatPrice(order.totals.refunded)} />
            <Line label="Refundable" value={formatPrice(order.refundable_amount)} />
          </Panel>

          <Panel title="Payments">
            {order.payments.length === 0 && <Typography variant="body2">No payment attempts.</Typography>}
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {order.payments.map((p) => (
                <Box key={p.id}>
                  <Line label={p.gateway === "cod" ? "Cash on Delivery" : `${p.gateway} ${p.method ? `· ${p.method.toUpperCase()}` : ""}`} value={<Chip size="small" label={p.status} color={p.status === "success" ? "success" : p.status === "failed" ? "error" : "default"} variant="outlined" />} />
                  <Line label="Amount" value={formatPrice(p.amount)} />
                  {p.gateway_payment_id && <Line label="Payment ID" value={p.gateway_payment_id} />}
                  {p.transaction_id && <Line label="Transaction ID" value={p.transaction_id} />}
                  {p.paid_at && <Line label="Paid" value={formatDateTime(p.paid_at)} />}
                  {p.failure_reason && <Line label="Failure" value={p.failure_reason} />}
                </Box>
              ))}
            </Stack>
          </Panel>

          {order.refunds.length > 0 && (
            <Panel title="Refunds">
              <Stack spacing={1.5} divider={<Divider flexItem />}>
                {order.refunds.map((r) => (
                  <Box key={r.id}>
                    <Line label={formatPrice(r.amount)} value={<Chip size="small" label={r.status} color={r.status === "processed" ? "success" : r.status === "failed" ? "error" : "warning"} variant="outlined" />} />
                    {r.reason && <Line label="Reason" value={r.reason} />}
                    {r.reference && <Line label="Reference" value={r.reference} />}
                    {r.gateway_refund_id && <Line label="Gateway refund" value={r.gateway_refund_id} />}
                    {r.status === "pending" && r.gateway === "cod" && hasPermission("orders.refund") && (
                      <Button size="small" sx={{ mt: 0.5 }} onClick={() => open({ processRefund: r.id }, { reference: "" })}>
                        Record bank / UPI transfer
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
            </Panel>
          )}
        </Stack>
      </Box>

      <Dialog open={dialog !== null} onClose={pending ? undefined : () => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {dialog === "status" ? "Update status" : dialog === "shipment" ? "Shipping & tracking" : dialog === "cancel" ? "Cancel order" : dialog === "refund" ? "Refund" : "Record manual refund"}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dialog === "status" && (
              <>
                <TextField select label="New status" value={s("status")} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {order.next_statuses.filter((st) => st.value !== "cancelled").map((st) => (
                    <MenuItem key={st.value} value={st.value}>
                      {st.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Note (shown to the customer)" value={s("comment")} onChange={(e) => setForm({ ...form, comment: e.target.value })} multiline minRows={2} />
              </>
            )}
            {dialog === "shipment" && (
              <>
                <TextField label="Courier / shipping partner" required value={s("carrier")} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="Delhivery, Blue Dart, India Post…" />
                <TextField label="Tracking number" value={s("tracking_number")} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} />
                <TextField label="Tracking URL" value={s("tracking_url")} onChange={(e) => setForm({ ...form, tracking_url: e.target.value })} placeholder="https://" />
                <TextField type="date" label="Expected delivery" value={s("expected_delivery_date")} onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                {order.next_statuses.some((st) => st.value === "shipped") && (
                  <FormControlLabel control={<Switch checked={Boolean(form.mark_shipped)} onChange={(e) => setForm({ ...form, mark_shipped: e.target.checked })} />} label="Mark the order as shipped (notifies the customer)" />
                )}
              </>
            )}
            {dialog === "cancel" && (
              <>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Stock goes back on the shelf{order.payment_status === "success" ? " and the paid amount is refunded automatically" : ""}. The customer is notified.
                </Typography>
                <TextField label="Reason" required value={s("reason")} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </>
            )}
            {dialog === "refund" && (
              <>
                <TextField label={`Amount (max ${formatPrice(order.refundable_amount)})`} required value={s("amount")} onChange={(e) => setForm({ ...form, amount: e.target.value })} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
                <TextField label="Reason" required value={s("reason")} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                {order.payment_method === "cod" ? (
                  <TextField label="Bank / UPI reference (if already paid out)" value={s("reference")} onChange={(e) => setForm({ ...form, reference: e.target.value })} helperText="Cash orders are refunded by bank or UPI transfer. Leave empty to record it later." />
                ) : (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    The refund is sent to the original payment method through the payment gateway.
                  </Typography>
                )}
              </>
            )}
            {typeof dialog === "object" && dialog !== null && (
              <TextField label="Bank / UPI transfer reference" required value={s("reference")} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} disabled={pending}>
            Close
          </Button>
          <Button
            variant="contained"
            color={dialog === "cancel" ? "error" : "primary"}
            loading={pending}
            onClick={() => {
              if (dialog === "status") return run(() => adminOrdersService.updateStatus(order.id, s("status"), s("comment") || undefined), "Status updated.");
              if (dialog === "shipment")
                return run(
                  () => adminOrdersService.saveShipment(order.id, { carrier: s("carrier"), tracking_number: s("tracking_number") || undefined, tracking_url: s("tracking_url") || undefined, expected_delivery_date: s("expected_delivery_date") || undefined, mark_shipped: Boolean(form.mark_shipped) }),
                  "Shipping details saved.",
                );
              if (dialog === "cancel") return run(() => adminOrdersService.cancel(order.id, s("reason")), "Order cancelled.");
              if (dialog === "refund") return run(() => adminOrdersService.refund(order.id, { amount: Number(s("amount")), reason: s("reason"), reference: s("reference") || undefined }), "Refund created.");
              if (typeof dialog === "object" && dialog) return run(() => adminOrdersService.processRefund(dialog.processRefund, s("reference")), "Refund recorded.");
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
