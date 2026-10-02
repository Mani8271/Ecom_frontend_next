"use client";

import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime } from "@/lib/format";
import { userMessage } from "@/services/api/errors";
import { orderTokens } from "@/services/orders/order-tokens";
import { ordersService } from "@/services/orders/orders.service";
import type { PublicTracking } from "@/services/orders/types";
import { OrderDetailView } from "./OrderDetailView";
import { OrderStatusChip } from "./OrderStatusChip";
import { TrackingTimeline } from "./TrackingTimeline";

function PublicResult({ result }: { result: PublicTracking }) {
  return (
    <Stack spacing={3} sx={{ mt: 4 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" component="h2">
            Order #{result.order_number}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Placed {formatDateTime(result.placed_at)} · {result.item_count} item{result.item_count === 1 ? "" : "s"}
          </Typography>
        </Box>
        <OrderStatusChip status={result.status} label={result.status_label} />
      </Stack>

      {result.shipment && (
        <Box sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover" }}>
          <Typography variant="body2">
            <strong>{result.shipment.carrier}</strong>
            {result.shipment.tracking_number ? ` · Tracking no. ${result.shipment.tracking_number}` : ""}
          </Typography>
          {result.shipment.tracking_url && (
            <Link href={result.shipment.tracking_url} target="_blank" rel="noopener noreferrer" variant="body2">
              Track on courier website
            </Link>
          )}
        </Box>
      )}
      {result.expected_delivery_date && (
        <Typography variant="body2">
          Expected delivery: <strong>{new Date(result.expected_delivery_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong>
        </Typography>
      )}

      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
        <TrackingTimeline tracking={result.tracking} />
      </Box>

      <Box>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Shipping to
        </Typography>
        <Typography variant="body2">
          {[result.shipping_address.name, result.shipping_address.city, result.shipping_address.state, result.shipping_address.postal_code].filter(Boolean).join(", ")}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * /track-order: customers and guests on the ordering device see the full
 * order; anyone else looks it up with order number + phone or email.
 */
export function TrackOrderView({ orderNumber }: { orderNumber?: string }) {
  const { status } = useAuth();
  const canOpenDirectly = Boolean(orderNumber) && (status === "authenticated" || Boolean(orderNumber && orderTokens.get(orderNumber)));
  const direct = useQuery({
    queryKey: ["orders", "detail", orderNumber?.toUpperCase() ?? ""],
    queryFn: () => ordersService.get(orderNumber!),
    enabled: status !== "loading" && canOpenDirectly,
    retry: false,
  });

  const [number, setNumber] = useState(orderNumber ?? "");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<PublicTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (status === "loading" || (canOpenDirectly && direct.isLoading)) return <PageSkeleton />;
  if (direct.data) return <OrderDetailView orderNumber={direct.data.order_number} />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      setResult(await ordersService.track(number.trim(), contact.trim()));
    } catch (err) {
      setResult(null);
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
        <LocalShippingOutlinedIcon sx={{ color: "primary.dark" }} />
        <Typography variant="h4" component="h1">
          Track your order
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Enter your order number and the mobile number or email used when ordering.
      </Typography>
      <Stack component="form" onSubmit={submit} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField label="Order number" placeholder="GK10245" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} required slotProps={{ htmlInput: { maxLength: 20 } }} />
        <TextField label="Mobile number or email" value={contact} onChange={(e) => setContact(e.target.value)} required slotProps={{ htmlInput: { maxLength: 191 } }} />
        <Button type="submit" variant="contained" loading={pending} sx={{ flexShrink: 0 }}>
          Track
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {result && <PublicResult result={result} />}
    </Box>
  );
}
