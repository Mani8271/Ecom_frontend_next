"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { EffectiveAttribute, VariantInput } from "@/services/admin/types";
import { AxisOptionsPicker, combinations, MAX_VARIANTS, type AxisSelection } from "./AxisOptionsPicker";

export interface VariantDraft {
  sku: string;
  price: string;
  compare_at_price: string;
  stock: string;
}

export interface VariantPlan {
  mode: "simple" | "variants";
  simple: VariantDraft;
  axes: AxisSelection[];
  defaults: VariantDraft;
  /** Per-combination overrides, keyed by combination key. */
  edits: Record<string, Partial<VariantDraft>>;
  excluded: string[];
}

const EMPTY_DRAFT: VariantDraft = { sku: "", price: "", compare_at_price: "", stock: "0" };

export function emptyVariantPlan(): VariantPlan {
  return { mode: "simple", simple: { ...EMPTY_DRAFT }, axes: [], defaults: { ...EMPTY_DRAFT }, edits: {}, excluded: [] };
}

const PRICE = /^\d+(\.\d{1,2})?$/;
const INT = /^\d+$/;

function draftError(draft: VariantDraft): string | null {
  if (!PRICE.test(draft.price.trim())) return "Enter a price";
  if (draft.compare_at_price.trim() && !PRICE.test(draft.compare_at_price.trim())) return "MRP must be an amount";
  if (draft.compare_at_price.trim() && Number(draft.compare_at_price) < Number(draft.price)) return "MRP should be at least the price";
  if (!INT.test(draft.stock.trim() || "0")) return "Stock must be a whole number";
  if (draft.sku.trim() && !/^[A-Za-z0-9._-]+$/.test(draft.sku.trim())) return "SKU: letters, numbers, dots, dashes, underscores";
  return null;
}

function toInput(draft: VariantDraft, options?: Record<string, number>): VariantInput {
  return {
    ...(draft.sku.trim() ? { sku: draft.sku.trim() } : {}),
    price: Number(draft.price),
    compare_at_price: draft.compare_at_price.trim() ? Number(draft.compare_at_price) : null,
    stock: Number(draft.stock || 0),
    ...(options ? { options } : {}),
  };
}

function rowsOf(plan: VariantPlan, candidates: EffectiveAttribute[]) {
  return combinations(plan.axes, candidates)
    .filter((combo) => !plan.excluded.includes(combo.key))
    .map((combo) => ({ ...combo, draft: { ...plan.defaults, sku: "", ...plan.edits[combo.key] } }));
}

/** Validates the plan and returns the request fields, or an error message. */
export function planToRequest(plan: VariantPlan, candidates: EffectiveAttribute[]): { variant_axes: string[]; variants: VariantInput[] } | { error: string } {
  if (plan.mode === "simple") {
    const error = draftError(plan.simple);
    return error ? { error: `Price & stock: ${error}.` } : { variant_axes: [], variants: [toInput(plan.simple)] };
  }

  const rows = rowsOf(plan, candidates);
  if (plan.axes.length === 0) return { error: "Choose what the variants differ by (e.g. Size), or switch to a single product." };
  if (rows.length === 0) return { error: "Select at least one option for every variant attribute." };
  if (rows.length > MAX_VARIANTS) return { error: `Too many variants (${rows.length}). The limit is ${MAX_VARIANTS}.` };

  for (const row of rows) {
    const error = draftError(row.draft);
    if (error) return { error: `${row.label}: ${error}.` };
  }

  return { variant_axes: plan.axes.map((a) => a.code), variants: rows.map((row) => toInput(row.draft, row.options)) };
}

function MoneyField({ label, value, onChange, size }: { label: string; value: string; onChange: (value: string) => void; size?: "small" }) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size={size}
      slotProps={{ htmlInput: { inputMode: "decimal" }, input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
    />
  );
}

export function VariantBuilder({ plan, onChange, candidates }: { plan: VariantPlan; onChange: (plan: VariantPlan) => void; candidates: EffectiveAttribute[] }) {
  const rows = plan.mode === "variants" ? rowsOf(plan, candidates) : [];
  const set = (patch: Partial<VariantPlan>) => onChange({ ...plan, ...patch });
  const edit = (key: string, patch: Partial<VariantDraft>) => set({ edits: { ...plan.edits, [key]: { ...plan.edits[key], ...patch } } });

  return (
    <Stack spacing={2.5}>
      <ToggleButtonGroup
        exclusive
        color="primary"
        value={plan.mode}
        onChange={(_, mode: VariantPlan["mode"] | null) => {
          if (!mode) return;
          // Pre-select the category's suggested axes the first time.
          const axes = mode === "variants" && plan.axes.length === 0 ? candidates.filter((a) => a.is_variant_axis).slice(0, 3).map((a) => ({ code: a.code, optionIds: [] })) : plan.axes;
          set({ mode, axes });
        }}
        size="small"
      >
        <ToggleButton value="simple">Single product</ToggleButton>
        <ToggleButton value="variants">Has variants (size, color…)</ToggleButton>
      </ToggleButtonGroup>

      {plan.mode === "simple" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MoneyField label="Selling price *" value={plan.simple.price} onChange={(price) => set({ simple: { ...plan.simple, price } })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MoneyField label="MRP" value={plan.simple.compare_at_price} onChange={(compare_at_price) => set({ simple: { ...plan.simple, compare_at_price } })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="Stock" value={plan.simple.stock} onChange={(e) => set({ simple: { ...plan.simple, stock: e.target.value } })} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField label="SKU" value={plan.simple.sku} onChange={(e) => set({ simple: { ...plan.simple, sku: e.target.value } })} placeholder="Auto" />
          </Grid>
        </Grid>
      ) : (
        <>
          <AxisOptionsPicker candidates={candidates} value={plan.axes} onChange={(axes) => set({ axes })} />

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Default price & stock for new variants
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
              <MoneyField size="small" label="Price *" value={plan.defaults.price} onChange={(price) => set({ defaults: { ...plan.defaults, price } })} />
              <MoneyField size="small" label="MRP" value={plan.defaults.compare_at_price} onChange={(compare_at_price) => set({ defaults: { ...plan.defaults, compare_at_price } })} />
              <TextField size="small" label="Stock each" value={plan.defaults.stock} onChange={(e) => set({ defaults: { ...plan.defaults, stock: e.target.value } })} />
              <Button variant="outlined" onClick={() => set({ edits: {} })} sx={{ flexShrink: 0 }} disabled={Object.keys(plan.edits).length === 0}>
                Apply to all
              </Button>
            </Stack>
          </Box>

          {rows.length > MAX_VARIANTS && <Alert severity="error">{rows.length} combinations. The limit is {MAX_VARIANTS} per product.</Alert>}

          {rows.length > 0 && (
            <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2, maxHeight: 520 }}>
              <Table size="small" stickyHeader aria-label="Variants">
                <TableHead>
                  <TableRow>
                    <TableCell>Variant ({rows.length})</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>SKU</TableCell>
                    <TableCell sx={{ minWidth: 110 }}>Price ₹</TableCell>
                    <TableCell sx={{ minWidth: 110 }}>MRP ₹</TableCell>
                    <TableCell sx={{ minWidth: 90 }}>Stock</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>{row.label}</TableCell>
                      <TableCell>
                        <TextField size="small" value={row.draft.sku} placeholder="Auto" onChange={(e) => edit(row.key, { sku: e.target.value })} slotProps={{ htmlInput: { "aria-label": `${row.label} SKU` } }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={row.draft.price} onChange={(e) => edit(row.key, { price: e.target.value })} slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": `${row.label} price` } }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={row.draft.compare_at_price} onChange={(e) => edit(row.key, { compare_at_price: e.target.value })} slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": `${row.label} MRP` } }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={row.draft.stock} onChange={(e) => edit(row.key, { stock: e.target.value })} slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": `${row.label} stock` } }} />
                      </TableCell>
                      <TableCell padding="checkbox">
                        <IconButton size="small" onClick={() => set({ excluded: [...plan.excluded, row.key] })} aria-label={`Don't create ${row.label}`}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {plan.excluded.length > 0 && (
            <Button size="small" onClick={() => set({ excluded: [] })} sx={{ alignSelf: "flex-start" }}>
              Restore {plan.excluded.length} removed combination{plan.excluded.length === 1 ? "" : "s"}
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
