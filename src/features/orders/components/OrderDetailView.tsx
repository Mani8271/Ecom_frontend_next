"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState, type ReactNode } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { usePayOnline } from "@/features/checkout/usePayOnline";
import { formatAddressLines, formatDateTime, formatPrice } from "@/lib/format";
import { isApiError } from "@/services/api/errors";
import { ordersService } from "@/services/orders/orders.service";
import type { Order } from "@/services/orders/types";
import { CancelOrderDialog, ReturnRequestDialog } from "./OrderDialogs";
import { OrderStatusChip } from "./OrderStatusChip";
import { TrackingTimeline } from "./TrackingTimeline";

export const orderKey = (orderNumber: string) => ["orders", "detail", orderNumber.toUpperCase()] as const;

function Panel({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        {icon}
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: tone === "success" ? "success.main" : "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function OrderDetailView({ orderNumber, justPlaced = false }: { orderNumber: string; justPlaced?: boolean }) {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { pay, pending: paying } = usePayOnline();
  const [dialog, setDialog] = useState<"cancel" | "return" | null>(null);
  const { data: order, isLoading, error, refetch } = useQuery({ queryKey: orderKey(orderNumber), queryFn: () => ordersService.get(orderNumber) });

  const put = (next: Order) => {
    queryClient.setQueryData(orderKey(orderNumber), next);
    void queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
  };

  if (isLoading) return <PageSkeleton />;
  if (error && isApiError(error) && error.status === 404) {
    return (
      <EmptyState
        icon={<ReceiptLongOutlinedIcon />}
        title="We couldn't find this order"
        description="Log in with the account used for the order, or track it with your order number and phone number."
        action={
          <LinkButton href={routes.trackOrder()} variant="contained">
            Track an order
          </LinkButton>
        }
      />
    );
  }
  if (error || !order) return <ErrorState error={error} onRetry={() => refetch()} />;

  async function completePayment() {
    const outcome = await pay(order!.order_number, null);
    if (outcome.status === "paid") {
      put(outcome.order);
      notify.success("Payment successful. Your order is placed!");
    } else if (outcome.status === "failed") {
      notify.error(outcome.message);
      void refetch();
    }
  }

  const address = order.shipping_address;
  const placedOk = justPlaced && order.status !== "payment_pending" && order.status !== "cancelled";

  return (
    <Stack spacing={3}>
      {placedOk && (
        <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, bgcolor: "primary.light", textAlign: "center" }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: "primary.dark" }} />
          <Typography variant="h5" component="h1" sx={{ mt: 1 }}>
            Thank you! Your order is placed.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Order {order.order_number} · A confirmation has been sent to {order.customer.email}
          </Typography>
        </Box>
      )}

      {order.status === "payment_pending" && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" variant="outlined" size="small" onClick={completePayment} loading={paying}>
              Complete payment
            </Button>
          }
        >
          Payment for this order is not complete yet. Your items are held for a short time – pay now to confirm the order.
        </Alert>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Box>
          <Typography variant={placedOk ? "h6" : "h4"} component={placedOk ? "h2" : "h1"}>
            Order {order.order_number}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Placed on {formatDateTime(order.placed_at)} · {order.item_count} item{order.item_count === 1 ? "" : "s"} · {formatPrice(order.grand_total)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <OrderStatusChip status={order.status} label={order.status_label} />
          {order.actions.can_cancel && (
            <Button size="small" color="error" variant="outlined" onClick={() => setDialog("cancel")}>
              Cancel order
            </Button>
          )}
          {order.actions.can_return && (
            <Button size="small" variant="outlined" onClick={() => setDialog("return")}>
              Return items
            </Button>
          )}
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1.3fr 1fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={3}>
          <Panel title="Items">
            <Stack spacing={2} divider={<Divider flexItem />}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" spacing={2}>
                  <Box
                    component="img"
                    src={item.image ?? undefined}
                    alt=""
                    sx={{ width: 72, height: 96, objectFit: "cover", borderRadius: 2, bgcolor: "action.hover", flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {item.product_slug ? (
                      <Link component={NextLink} href={routes.product(item.product_slug)} variant="subtitle2" sx={{ color: "text.primary" }}>
                        {item.name}
                      </Link>
                    ) : (
                      <Typography variant="subtitle2">{item.name}</Typography>
                    )}
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {[...Object.entries(item.options).map(([k, v]) => `${k}: ${v}`), `Qty ${item.quantity}`].join(" · ")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {formatPrice(item.line_total)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                      {item.qty_cancelled > 0 && <Chip size="small" label="Cancelled" />}
                      {item.qty_returned > 0 && <Chip size="small" label={`${item.qty_returned} returned`} />}
                      {item.can_review && item.product_slug && (
                        <Link component={NextLink} href={`${routes.product(item.product_slug)}#reviews`} variant="body2">
                          Rate & review
                        </Link>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Panel>

          <Panel title="Tracking" icon={<LocalShippingOutlinedIcon sx={{ color: "primary.dark" }} />}>
            {order.shipment && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
                <Typography variant="body2">
                  <strong>{order.shipment.carrier}</strong>
                  {order.shipment.tracking_number ? ` · Tracking no. ${order.shipment.tracking_number}` : ""}
                </Typography>
                {order.shipment.tracking_url && (
                  <Link href={order.shipment.tracking_url} target="_blank" rel="noopener noreferrer" variant="body2">
                    Track on courier website
                  </Link>
                )}
              </Box>
            )}
            {order.expected_delivery_date && !["delivered", "cancelled", "returned", "refunded"].includes(order.status) && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Expected delivery by <strong>{new Date(order.expected_delivery_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong>
              </Typography>
            )}
            <TrackingTimeline tracking={order.tracking} />
          </Panel>

          {order.returns.length > 0 && (
            <Panel title="Returns">
              <Stack spacing={1.5}>
                {order.returns.map((r) => (
                  <Box key={r.rma_number} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2">{r.rma_number}</Typography>
                      <Chip size="small" label={r.status_label} color={r.status === "rejected" ? "default" : "primary"} variant="outlined" />
                    </Stack>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {r.reason} · Refund {formatPrice(r.refund_amount)}
                    </Typography>
                    {r.admin_note && <Typography variant="caption">Note from store: {r.admin_note}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Panel>
          )}
        </Stack>

        <Stack spacing={3}>
          <Panel title="Price details">
            <Stack spacing={1}>
              <Row label="Total MRP" value={formatPrice(order.totals.mrp_total)} />
              {Number(order.totals.product_discount) > 0 && <Row label="Discount on MRP" value={`− ${formatPrice(order.totals.product_discount)}`} tone="success" />}
              {Number(order.totals.coupon_discount) > 0 && <Row label={`Coupon (${order.totals.coupon_code})`} value={`− ${formatPrice(order.totals.coupon_discount)}`} tone="success" />}
              <Row label="Delivery" value={Number(order.totals.shipping) > 0 ? formatPrice(order.totals.shipping) : "FREE"} />
              {Number(order.totals.cod_fee) > 0 && <Row label="COD fee" value={formatPrice(order.totals.cod_fee)} />}
              <Divider />
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {formatPrice(order.totals.grand_total)}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Includes {formatPrice(order.totals.tax_included)} GST
              </Typography>
              {Number(order.totals.refunded) > 0 && <Row label="Refunded" value={formatPrice(order.totals.refunded)} tone="success" />}
            </Stack>
          </Panel>

          <Panel title="Payment">
            <Typography variant="body2">{order.payment_method_label}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Status: {order.payment_status_label}
              {order.payment?.method && order.payment.method !== "cod" ? ` · ${order.payment.method.toUpperCase()}` : ""}
            </Typography>
            {order.payment?.transaction_id && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Transaction ID: {order.payment.transaction_id}
              </Typography>
            )}
            {order.refunds.map((r, i) => (
              <Typography key={i} variant="body2" sx={{ mt: 1 }}>
                Refund {formatPrice(r.amount)} – {r.status === "processed" ? `processed ${formatDateTime(r.processed_at)}` : r.status}
              </Typography>
            ))}
          </Panel>

          <Panel title="Delivery address">
            <Typography variant="subtitle2">{address.name}</Typography>
            {formatAddressLines(address).map((line) => (
              <Typography key={line} variant="body2" sx={{ color: "text.secondary" }}>
                {line}
              </Typography>
            ))}
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Mobile: {address.phone}
            </Typography>
          </Panel>

          {order.cancellation && (
            <Alert severity="info">
              Cancelled {formatDateTime(order.cancellation.cancelled_at)}
              {order.cancellation.reason ? ` – ${order.cancellation.reason}` : ""}
            </Alert>
          )}

          <Stack direction="row" spacing={1.5}>
            <LinkButton href={routes.search()} variant="outlined" fullWidth>
              Continue shopping
            </LinkButton>
          </Stack>
        </Stack>
      </Box>

      {dialog === "cancel" && (
        <CancelOrderDialog
          order={order}
          onClose={() => setDialog(null)}
          onDone={(next) => {
            put(next);
            setDialog(null);
            notify.success("Your order has been cancelled.");
          }}
        />
      )}
      {dialog === "return" && (
        <ReturnRequestDialog
          order={order}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            void refetch();
            notify.success("Return requested. We'll keep you updated.");
          }}
        />
      )}
    </Stack>
  );
}
