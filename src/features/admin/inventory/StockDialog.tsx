"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { userMessage } from "@/services/api/errors";
import { inventoryService } from "@/services/admin/analytics.service";
import type { InventoryRow, StockAction } from "@/services/admin/analytics.types";

const ACTIONS: { value: StockAction; label: string; help: string }[] = [
  { value: "restock", label: "Add stock", help: "Goods received (restock)" },
  { value: "damage", label: "Remove", help: "Damaged, lost or written off" },
  { value: "adjust", label: "Adjust ±", help: "Manual correction up or down" },
  { value: "set", label: "Set count", help: "Physical stock count" },
];

/** Manage stock for one variant. Every change is saved as a movement with reason and admin. */
export function StockDialog({ row, onClose, onSaved }: { row: InventoryRow; onClose: () => void; onSaved: () => void }) {
  const [action, setAction] = useState<StockAction>(row.stock_state === "out" || row.stock_state === "low" ? "restock" : "adjust");
  const [quantity, setQuantity] = useState(row.stock_state === "low" || row.stock_state === "out" ? String(row.recommended_reorder || "") : "");
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState(String(row.low_stock_threshold));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useQuery({ queryKey: ["admin", "inventory", "history", row.variant_id], queryFn: () => inventoryService.history({ variant_id: row.variant_id, limit: 8 }) });

  const qty = Number(quantity);
  const valid = quantity.trim() !== "" && Number.isInteger(qty) && (action === "adjust" ? qty !== 0 : action === "set" ? qty >= 0 : qty > 0);
  const next = !valid ? null : action === "restock" ? row.on_hand + qty : action === "damage" ? row.on_hand - qty : action === "adjust" ? row.on_hand + qty : qty;
  const thresholdChanged = threshold !== String(row.low_stock_threshold) && /^\d+$/.test(threshold);

  async function save() {
    setPending(true);
    setError(null);
    try {
      if (valid) {
        await inventoryService.adjust(row.variant_id, {
          action,
          quantity: qty,
          reason: reason.trim() || ACTIONS.find((a) => a.value === action)!.help,
          ...(thresholdChanged ? { low_stock_threshold: Number(threshold) } : {}),
        });
      } else if (thresholdChanged) {
        await inventoryService.setThreshold(row.variant_id, Number(threshold));
      }
      onSaved();
    } catch (err) {
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Manage stock
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {row.product_name} · {row.sku}
          {row.variant_title ? ` · ${row.variant_title}` : ""}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack direction="row" spacing={3} sx={{ mb: 2.5 }}>
          {[
            ["On hand", row.on_hand],
            ["Reserved", row.reserved],
            ["Available", row.available],
            ["Sold", row.sold],
          ].map(([label, value]) => (
            <Box key={label as string}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {label}
              </Typography>
              <Typography variant="h6">{value}</Typography>
            </Box>
          ))}
        </Stack>
        <ToggleButtonGroup exclusive size="small" color="primary" value={action} onChange={(_, v: StockAction | null) => v && setAction(v)} sx={{ mb: 2, flexWrap: "wrap" }}>
          {ACTIONS.map((a) => (
            <ToggleButton key={a.value} value={a.value}>
              {a.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label={action === "set" ? "Counted quantity" : action === "adjust" ? "Change (e.g. -2 or 5)" : "Quantity"}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
            helperText={next !== null ? `New on-hand stock: ${next}` : ACTIONS.find((a) => a.value === action)!.help}
            error={next !== null && (next < 0 || next < row.reserved)}
          />
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ACTIONS.find((a) => a.value === action)!.help} slotProps={{ htmlInput: { maxLength: 255 } }} />
        </Stack>
        <TextField sx={{ mt: 2, maxWidth: 240 }} label="Low-stock threshold" value={threshold} onChange={(e) => setThreshold(e.target.value)} slotProps={{ htmlInput: { inputMode: "numeric" } }} helperText="Alert when available stock falls to this" />

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Recent history
        </Typography>
        <Stack spacing={0.75} sx={{ mt: 0.5 }}>
          {history.data?.data.length === 0 && <Typography variant="body2">No movements yet.</Typography>}
          {history.data?.data.map((m) => (
            <Stack key={m.id} direction="row" spacing={1.5} sx={{ justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {m.action}{" "}
                  <Typography component="span" variant="body2" sx={{ color: m.change >= 0 ? "success.main" : "error.main" }}>
                    {m.change > 0 ? "+" : ""}
                    {m.change}
                  </Typography>{" "}
                  → {m.new_stock}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap component="div">
                  {[m.reason, m.admin].filter(Boolean).join(" · ")}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                {formatDateTime(m.at)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} loading={pending} disabled={!valid && !thresholdChanged}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
