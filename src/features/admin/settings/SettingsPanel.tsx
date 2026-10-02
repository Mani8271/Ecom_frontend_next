"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { indianStates } from "@/config/india-states";
import { useAuth } from "@/features/auth/AuthProvider";
import { isApiError, userMessage } from "@/services/api/errors";
import { adminSettingsService } from "@/services/admin/commerce.service";
import type { StoreSettings } from "@/services/admin/commerce.types";

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<StoreSettings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const canEdit = hasPermission("settings.update");
  const set = (key: string, value: string | number | boolean | null) => setValues((v) => ({ ...v, [key]: value }));
  const text = (key: string) => (values[key] === null || values[key] === undefined ? "" : String(values[key]));
  const err = (key: string) => errors[`settings.${key}`];

  async function save() {
    setPending(true);
    setErrors({});
    setFormError(null);
    const numeric = ["shipping.flat_fee", "shipping.free_above", "shipping.delivery_days_min", "shipping.delivery_days_max", "payment.cod_fee", "returns.window_days"];
    const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, numeric.includes(k) && v !== "" && v !== null ? Number(v) : v === "" ? null : v]));
    try {
      const saved = await adminSettingsService.save(payload);
      setValues(saved);
      queryClient.setQueryData(["admin", "settings"], saved);
      notify.success("Settings saved.");
    } catch (e) {
      if (isApiError(e) && e.isValidation) setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, m]) => [k.replace(/\\\./g, "."), m[0]])));
      setFormError(userMessage(e));
    } finally {
      setPending(false);
    }
  }

  const money = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } };

  return (
    <Box sx={{ display: "grid", gap: 2.5, maxWidth: 900 }}>
      {formError && <Alert severity="error">{formError}</Alert>}
      <Card title="Store" description="Shown on invoices and customer emails. The state decides CGST + SGST (same state) vs IGST.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Store name" value={text("store.name")} onChange={(e) => set("store.name", e.target.value)} disabled={!canEdit} error={Boolean(err("store.name"))} helperText={err("store.name")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Store state (GST)" value={text("store.state_code")} onChange={(e) => set("store.state_code", e.target.value)} disabled={!canEdit}>
              {indianStates.map((s) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="GSTIN" value={text("store.gstin")} onChange={(e) => set("store.gstin", e.target.value.toUpperCase())} disabled={!canEdit} error={Boolean(err("store.gstin"))} helperText={err("store.gstin") ?? "15 characters"} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Support email" value={text("store.support_email")} onChange={(e) => set("store.support_email", e.target.value)} disabled={!canEdit} error={Boolean(err("store.support_email"))} helperText={err("store.support_email")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Support phone" value={text("store.support_phone")} onChange={(e) => set("store.support_phone", e.target.value)} disabled={!canEdit} />
          </Grid>
        </Grid>
      </Card>
      <Card title="Shipping" description="Delivery charge applies below the free-shipping amount (after coupon discounts).">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Delivery charge" value={text("shipping.flat_fee")} onChange={(e) => set("shipping.flat_fee", e.target.value)} disabled={!canEdit} slotProps={money} error={Boolean(err("shipping.flat_fee"))} helperText={err("shipping.flat_fee")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Free delivery above" value={text("shipping.free_above")} onChange={(e) => set("shipping.free_above", e.target.value)} disabled={!canEdit} slotProps={money} error={Boolean(err("shipping.free_above"))} helperText={err("shipping.free_above")} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Delivery min days" value={text("shipping.delivery_days_min")} onChange={(e) => set("shipping.delivery_days_min", e.target.value)} disabled={!canEdit} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Delivery max days" value={text("shipping.delivery_days_max")} onChange={(e) => set("shipping.delivery_days_max", e.target.value)} disabled={!canEdit} error={Boolean(err("shipping.delivery_days_max"))} helperText={err("shipping.delivery_days_max")} />
          </Grid>
        </Grid>
      </Card>
      <Card title="Payments, returns & reviews">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Cash on Delivery fee" value={text("payment.cod_fee")} onChange={(e) => set("payment.cod_fee", e.target.value)} disabled={!canEdit} slotProps={money} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Return window (days after delivery)" value={text("returns.window_days")} onChange={(e) => set("returns.window_days", e.target.value)} disabled={!canEdit} />
          </Grid>
          <Grid size={12}>
            <FormControlLabel control={<Switch checked={Boolean(values["reviews.auto_approve"])} onChange={(e) => set("reviews.auto_approve", e.target.checked)} disabled={!canEdit} />} label="Publish reviews without moderation" />
          </Grid>
        </Grid>
      </Card>
      {canEdit && (
        <Box>
          <Button variant="contained" size="large" onClick={save} loading={pending}>
            Save settings
          </Button>
        </Box>
      )}
    </Box>
  );
}

export function SettingsPanel() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "settings"], queryFn: adminSettingsService.get });

  return (
    <>
      <PageHeader title="Settings" description="Store-wide settings used at checkout. Payment gateway keys stay in the server environment, never here." />
      {isLoading ? <FormSkeleton fields={6} /> : error || !data ? <ErrorState error={error} onRetry={() => refetch()} /> : <SettingsForm initial={data} />}
    </>
  );
}
