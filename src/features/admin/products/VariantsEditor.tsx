"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { isApiError } from "@/services/api/errors";
import type { AdminProduct, AdminVariant, EffectiveAttribute, VariantBulkRow, VariantStatus } from "@/services/admin/types";
import { useCategoryAttributes } from "../catalog/queries";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useNotify } from "../notify";
import { AxisOptionsPicker, combinations, MAX_VARIANTS, type AxisSelection } from "./AxisOptionsPicker";
import { useProductEditor } from "./queries";

interface Draft {
  id: number;
  label: string;
  sku: string;
  price: string;
  compare_at_price: string;
  sale_price: string;
  stock: string;
  reserved: number;
  status: VariantStatus;
}

const PRICE = /^\d+(\.\d{1,2})?$/;

function toDraft(v: AdminVariant): Draft {
  return {
    id: v.id,
    label: v.title || "Default",
    sku: v.sku,
    price: String(Number(v.price)),
    compare_at_price: v.compare_at_price === null ? "" : String(Number(v.compare_at_price)),
    sale_price: v.sale_price === null ? "" : String(Number(v.sale_price)),
    stock: String(v.stock.on_hand),
    reserved: v.stock.reserved,
    status: v.status,
  };
}

/** Only the fields that changed, in the bulk endpoint's shape; or an error message. */
function diff(original: Draft, draft: Draft): VariantBulkRow | string | null {
  if (!PRICE.test(draft.price)) return `${draft.label}: enter a valid price.`;
  for (const [name, value] of [["MRP", draft.compare_at_price], ["Sale price", draft.sale_price]] as const) {
    if (value && !PRICE.test(value)) return `${draft.label}: ${name} must be an amount.`;
  }
  if (!/^\d+$/.test(draft.stock)) return `${draft.label}: stock must be a whole number.`;
  if (!/^[A-Za-z0-9._-]+$/.test(draft.sku)) return `${draft.label}: SKU can contain letters, numbers, dots, dashes and underscores.`;

  const row: VariantBulkRow = { id: draft.id };
  if (draft.sku !== original.sku) row.sku = draft.sku;
  if (draft.price !== original.price) row.price = Number(draft.price);
  if (draft.compare_at_price !== original.compare_at_price) row.compare_at_price = draft.compare_at_price ? Number(draft.compare_at_price) : null;
  if (draft.sale_price !== original.sale_price) row.sale_price = draft.sale_price ? Number(draft.sale_price) : null;
  if (draft.stock !== original.stock) row.stock = Number(draft.stock);
  if (draft.status !== original.status) row.status = draft.status;

  return Object.keys(row).length > 1 ? row : null;
}

export function VariantsEditor({ product }: { product: AdminProduct }) {
  const signature = product.variants.map((v) => `${v.id}:${v.sku}:${v.price}:${v.compare_at_price}:${v.sale_price}:${v.stock.on_hand}:${v.status}`).join("|");
  const { data: categoryAttributes, isLoading } = useCategoryAttributes(product.primary_category_id);

  return (
    <Stack spacing={3}>
      {/* Remount (fresh drafts) whenever the saved variants change. */}
      <VariantGrid key={signature} product={product} />
      {isLoading ? <FormSkeleton fields={2} /> : <AddVariants key={`add-${signature}`} product={product} effective={categoryAttributes?.effective ?? []} />}
    </Stack>
  );
}

function VariantGrid({ product }: { product: AdminProduct }) {
  const originals = product.variants.map(toDraft);
  const [drafts, setDrafts] = useState<Draft[]>(originals);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Draft | null>(null);
  const { bulkVariants, deleteVariant } = useProductEditor(product.id);
  const notify = useNotify();

  const edit = (id: number, patch: Partial<Draft>) => setDrafts((current) => current.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const changes = drafts.map((draft, i) => diff(originals[i], draft));
  const dirty = changes.some((c) => c !== null);

  async function save() {
    setError(null);
    const invalid = changes.find((c): c is string => typeof c === "string");
    if (invalid) {
      setError(invalid);
      return;
    }
    const rows = changes.filter((c): c is VariantBulkRow => c !== null && typeof c !== "string");
    try {
      await bulkVariants.mutateAsync(rows);
      notify.success(`${rows.length} variant${rows.length === 1 ? "" : "s"} saved.`);
    } catch (err) {
      setError(isApiError(err) && err.isValidation ? Object.values(err.errors)[0]?.[0] ?? err.message : isApiError(err) ? err.message : "Couldn't save the variants.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteVariant.mutateAsync(deleting.id);
      notify.success("Variant deleted.");
    } catch (err) {
      notify.error(err);
    } finally {
      setDeleting(null);
    }
  }

  const money = (label: string) => ({
    htmlInput: { inputMode: "decimal" as const, "aria-label": label },
    input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
  });

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              Variants ({product.variants.length})
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Edit prices and stock, then save. Sale price applies immediately while set.
            </Typography>
          </Box>
          <Button variant="contained" onClick={save} disabled={!dirty} loading={bulkVariants.isPending}>
            Save variants
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Table size="small" aria-label="Variants">
            <TableHead>
              <TableRow>
                <TableCell>Variant</TableCell>
                <TableCell sx={{ minWidth: 170 }}>SKU</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Price</TableCell>
                <TableCell sx={{ minWidth: 120 }}>MRP</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Sale price</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Stock</TableCell>
                <TableCell>Active</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {drafts.map((d, i) => (
                <TableRow key={d.id} sx={{ bgcolor: changes[i] ? "action.hover" : undefined }}>
                  <TableCell sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>{d.label}</TableCell>
                  <TableCell>
                    <TextField size="small" value={d.sku} onChange={(e) => edit(d.id, { sku: e.target.value.toUpperCase() })} slotProps={{ htmlInput: { "aria-label": `${d.label} SKU` } }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={d.price} onChange={(e) => edit(d.id, { price: e.target.value })} slotProps={money(`${d.label} price`)} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={d.compare_at_price} onChange={(e) => edit(d.id, { compare_at_price: e.target.value })} slotProps={money(`${d.label} MRP`)} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={d.sale_price} onChange={(e) => edit(d.id, { sale_price: e.target.value })} slotProps={money(`${d.label} sale price`)} />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={d.stock}
                      onChange={(e) => edit(d.id, { stock: e.target.value })}
                      helperText={d.reserved ? `${d.reserved} reserved` : undefined}
                      slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": `${d.label} stock on hand` } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch checked={d.status === "active"} onChange={(e) => edit(d.id, { status: e.target.checked ? "active" : "inactive" })} slotProps={{ input: { "aria-label": `${d.label} active` } }} />
                  </TableCell>
                  <TableCell padding="checkbox">
                    <Tooltip title={drafts.length <= 1 ? "A product needs at least one variant" : "Delete variant"}>
                      <span>
                        <IconButton size="small" disabled={drafts.length <= 1} onClick={() => setDeleting(d)} aria-label={`Delete ${d.label}`}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.label ?? "variant"}?`}
        description="Shoppers can no longer buy this variant. Past orders are not affected."
        confirmLabel="Delete"
        destructive
        pending={deleteVariant.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}

function AddVariants({ product, effective }: { product: AdminProduct; effective: EffectiveAttribute[] }) {
  const hasAxes = product.variant_axes.length > 0;
  const axisCodeById = new Map(product.variant_axes.map((a) => [a.id, a.code]));

  // Options already used per axis, e.g. { color: [3, 5], size: [10, 11] }.
  const existing: Record<string, number[]> = {};
  for (const variant of product.variants) {
    for (const option of variant.options) {
      const code = axisCodeById.get(option.attribute_id);
      if (code && !existing[code]?.includes(option.option_id)) existing[code] = [...(existing[code] ?? []), option.option_id];
    }
  }
  const existingKeys = new Set(
    product.variants.map((v) => product.variant_axes.map((axis) => `${axis.code}:${v.options.find((o) => o.attribute_id === axis.id)?.option_id}`).join("|")),
  );

  const candidates = hasAxes
    ? product.variant_axes.map((axis) => effective.find((a) => a.code === axis.code)).filter((a): a is EffectiveAttribute => Boolean(a))
    : effective.filter((a) => a.can_be_variant_axis);

  const [axes, setAxes] = useState<AxisSelection[]>(() => (hasAxes ? product.variant_axes.map((a) => ({ code: a.code, optionIds: existing[a.code] ?? [] })) : []));
  const [defaults, setDefaults] = useState(() => ({ price: String(Number(product.variants[0]?.price ?? 0)), compare_at_price: product.variants[0]?.compare_at_price ? String(Number(product.variants[0].compare_at_price)) : "", stock: "0" }));
  const [error, setError] = useState<string | null>(null);
  const { generateVariants } = useProductEditor(product.id);
  const notify = useNotify();

  const newCount = combinations(axes, candidates).filter((c) => !existingKeys.has(c.key)).length;

  async function generate() {
    setError(null);
    if (!PRICE.test(defaults.price)) return setError("Enter a price for the new variants.");
    if (defaults.compare_at_price && !PRICE.test(defaults.compare_at_price)) return setError("MRP must be an amount.");
    if (!/^\d+$/.test(defaults.stock || "0")) return setError("Stock must be a whole number.");
    if (product.variants.length + newCount > MAX_VARIANTS) return setError(`A product can have at most ${MAX_VARIANTS} variants.`);

    try {
      const { data } = await generateVariants.mutateAsync({
        axes: Object.fromEntries(axes.map((a) => [a.code, a.optionIds])),
        price: Number(defaults.price),
        compare_at_price: defaults.compare_at_price ? Number(defaults.compare_at_price) : null,
        stock: Number(defaults.stock || 0),
      });
      notify.success(`${data.length} variant${data.length === 1 ? "" : "s"} created.`);
    } catch (err) {
      setError(isApiError(err) ? (Object.values(err.errors)[0]?.[0] ?? err.message) : "Couldn't create the variants.");
    }
  }

  if (candidates.length === 0 && !hasAxes) {
    return (
      <Alert severity="info">
        To sell this product in several sizes/colors, mark an attribute with “Can create variants” and assign it to the product&apos;s category.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" component="h2">
          {hasAxes ? "Add more options" : "Create variants"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          {hasAxes
            ? `Select extra ${product.variant_axes.map((a) => a.name).join(" / ")} values. Only missing combinations are created.`
            : "This product has a single price and stock. Choose what the variants differ by; the current single variant is replaced."}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <AxisOptionsPicker candidates={candidates} value={axes} onChange={setAxes} lockAxes={hasAxes} existing={existing} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5, alignItems: { sm: "center" } }}>
          <TextField size="small" label="Price *" value={defaults.price} onChange={(e) => setDefaults({ ...defaults, price: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
          <TextField size="small" label="MRP" value={defaults.compare_at_price} onChange={(e) => setDefaults({ ...defaults, compare_at_price: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
          <TextField size="small" label="Stock each" value={defaults.stock} onChange={(e) => setDefaults({ ...defaults, stock: e.target.value })} />
          <Button variant="contained" onClick={generate} disabled={newCount === 0} loading={generateVariants.isPending} sx={{ flexShrink: 0 }}>
            {newCount === 0 ? "Nothing new" : `Create ${newCount} variant${newCount === 1 ? "" : "s"}`}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
