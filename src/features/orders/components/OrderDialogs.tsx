"use client";

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { QuantitySelector } from "@/features/cart/components/QuantitySelector";
import { formatPrice } from "@/lib/format";
import { userMessage } from "@/services/api/errors";
import { ordersService } from "@/services/orders/orders.service";
import type { Order } from "@/services/orders/types";

export function CancelOrderDialog({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: (order: Order) => void }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paid = order.payment_status === "success";

  async function submit() {
    setPending(true);
    setError(null);
    try {
      onDone(await ordersService.cancel(order.order_number, reason, comment || undefined));
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="cancel-title">
      <DialogTitle id="cancel-title">Cancel order {order.order_number}?</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 1.5, color: "text.secondary" }}>
          Why are you cancelling?
        </Typography>
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
          {order.actions.cancel_reasons.map((r) => (
            <FormControlLabel key={r} value={r} control={<Radio size="small" />} label={r} />
          ))}
        </RadioGroup>
        <TextField sx={{ mt: 1 }} size="small" label="Anything else? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} />
        {paid && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {formatPrice(order.totals.grand_total)} will be refunded to your original payment method.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Keep order
        </Button>
        <Button variant="contained" color="error" disabled={!reason} loading={pending} onClick={submit}>
          Cancel order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReturnRequestDialog({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const returnable = order.items.filter((i) => i.returnable_quantity > 0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const refund = returnable.reduce((sum, item) => sum + (selected[item.id] ? (Number(item.line_total) / item.quantity) * selected[item.id] : 0), 0);

  async function submit() {
    setPending(true);
    setError(null);
    const form = new FormData();
    form.append("reason", reason);
    if (description) form.append("description", description);
    Object.entries(selected).forEach(([id, qty], i) => {
      form.append(`items[${i}][order_item_id]`, id);
      form.append(`items[${i}][quantity]`, String(qty));
    });
    photos.forEach((file) => form.append("images[]", file));
    try {
      await ordersService.requestReturn(order.order_number, form);
      onDone();
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="return-title">
      <DialogTitle id="return-title">Return items</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Choose the items to return{order.actions.return_window_ends_at ? ` (return window closes on ${new Date(order.actions.return_window_ends_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})` : ""}.
        </Typography>
        <Stack spacing={1.5}>
          {returnable.map((item) => (
            <Stack key={item.id} direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.25, border: 1, borderColor: selected[item.id] ? "primary.main" : "divider", borderRadius: 2 }}>
              <Checkbox
                checked={Boolean(selected[item.id])}
                onChange={(e) => setSelected((s) => {
                  const next = { ...s };
                  if (e.target.checked) next[item.id] = 1;
                  else delete next[item.id];
                  return next;
                })}
                slotProps={{ input: { "aria-label": `Return ${item.name}` } }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {item.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.variant_title ?? ""} {item.returnable_quantity > 1 ? `· up to ${item.returnable_quantity}` : ""}
                </Typography>
              </Box>
              {selected[item.id] && item.returnable_quantity > 1 && (
                <QuantitySelector size="small" value={selected[item.id]} max={item.returnable_quantity} onChange={(q) => setSelected((s) => ({ ...s, [item.id]: q }))} />
              )}
            </Stack>
          ))}
        </Stack>
        <TextField select sx={{ mt: 2.5 }} label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
          {order.actions.return_reasons.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>
        <TextField sx={{ mt: 2 }} label="Tell us more (optional)" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 2 }}>
          <Button size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => input.current?.click()} disabled={photos.length >= 5}>
            Add photos
          </Button>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {photos.length ? `${photos.length} photo(s) selected` : "Optional, up to 5 (helps with damaged items)"}
          </Typography>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files ?? [])].slice(0, 5))} />
        </Stack>
        {refund > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Estimated refund: {formatPrice(refund)} (after the items are picked up and checked).
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!reason || Object.keys(selected).length === 0} loading={pending} onClick={submit}>
          Request return
        </Button>
      </DialogActions>
    </Dialog>
  );
}
