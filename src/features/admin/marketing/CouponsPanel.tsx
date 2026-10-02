"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { isApiError, userMessage } from "@/services/api/errors";
import { analyticsService } from "@/services/admin/analytics.service";
import { adminCatalogService } from "@/services/admin/catalog.service";
import { adminCouponsService } from "@/services/admin/commerce.service";
import type { CouponDetail, CouponInput, CouponRow } from "@/services/admin/commerce.types";
import { AnalyticsFiltersBar } from "../analytics/AnalyticsFiltersBar";
import { KpiCard, KpiGrid, KpiSkeleton } from "../analytics/KpiCard";
import { useAnalyticsFilters } from "../analytics/useAnalyticsFilters";
import { useAnalyticsQuery } from "../analytics/useAnalyticsQuery";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";

const STATE = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "default" },
  expired: { label: "Expired", color: "default" },
  scheduled: { label: "Scheduled", color: "info" },
  used_up: { label: "Used up", color: "warning" },
} as const;

type Option = { id: number; name: string };
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function SearchMulti({ label, value, onChange, search }: { label: string; value: Option[]; onChange: (v: Option[]) => void; search: (q: string) => Promise<Option[]> }) {
  const [input, setInput] = useState("");
  const q = useDebouncedValue(input.trim());
  const { data = [], isFetching } = useQuery({ queryKey: ["admin", "coupon-picker", label, q], queryFn: () => search(q) });
  return (
    <Autocomplete
      multiple
      options={data}
      value={value}
      loading={isFetching}
      filterOptions={(o) => o}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, v) => onChange(v)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      renderValue={(items, getItemProps) => items.map((o, index) => <Chip size="small" label={o.name} {...getItemProps({ index })} key={o.id} />)}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

function CouponDialog({ id, onClose, onSaved }: { id?: number; onClose: () => void; onSaved: () => void }) {
  const existing = useQuery({ queryKey: ["admin", "coupons", "detail", id], queryFn: () => adminCouponsService.get(id!), enabled: Boolean(id) });
  if (id && existing.isLoading) {
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="sm">
        <DialogContent>
          <FormSkeleton fields={6} />
        </DialogContent>
      </Dialog>
    );
  }
  return <CouponForm coupon={existing.data} onClose={onClose} onSaved={onSaved} />;
}

function CouponForm({ coupon, onClose, onSaved }: { coupon?: CouponDetail; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? "percentage",
    value: coupon?.value ? String(Number(coupon.value)) : "",
    min_order_amount: coupon?.min_order_amount ? String(Number(coupon.min_order_amount)) : "",
    max_discount_amount: coupon?.max_discount_amount ? String(Number(coupon.max_discount_amount)) : "",
    starts_at: toLocal(coupon?.starts_at ?? null),
    ends_at: toLocal(coupon?.ends_at ?? null),
    usage_limit: coupon?.usage_limit ? String(coupon.usage_limit) : "",
    per_user_limit: coupon?.per_user_limit ? String(coupon.per_user_limit) : "1",
    first_order_only: coupon?.first_order_only ?? false,
    scope: coupon?.scope ?? "all",
    is_active: coupon?.is_active ?? true,
  });
  const [products, setProducts] = useState<Option[]>(coupon?.products ?? []);
  const [categories, setCategories] = useState<Option[]>(coupon?.categories ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));
  const num = (s: string) => (s.trim() === "" ? null : Number(s));

  async function save() {
    setPending(true);
    setErrors({});
    setFormError(null);
    const input: CouponInput = {
      code: v.code.trim().toUpperCase(),
      description: v.description || null,
      type: v.type,
      value: v.value,
      min_order_amount: v.min_order_amount || null,
      max_discount_amount: v.type === "percentage" ? v.max_discount_amount || null : null,
      starts_at: v.starts_at ? new Date(v.starts_at).toISOString() : null,
      ends_at: v.ends_at ? new Date(v.ends_at).toISOString() : null,
      usage_limit: num(v.usage_limit),
      per_user_limit: num(v.per_user_limit),
      first_order_only: v.first_order_only,
      scope: v.scope,
      is_active: v.is_active,
      product_ids: v.scope === "products" ? products.map((p) => p.id) : [],
      category_ids: v.scope === "categories" ? categories.map((c) => c.id) : [],
    };
    try {
      await (coupon ? adminCouponsService.update(coupon.id, input) : adminCouponsService.create(input));
      onSaved();
    } catch (err) {
      if (isApiError(err) && err.isValidation) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, m]) => [k, m[0]])));
      setFormError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{coupon ? `Edit ${coupon.code}` : "Create coupon"}</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Code" required value={v.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} error={Boolean(errors.code)} helperText={errors.code ?? "e.g. DIWALI20"} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Description" value={v.description} onChange={(e) => set({ description: e.target.value })} helperText="Shown to shoppers" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Discount type" value={v.type} onChange={(e) => set({ type: e.target.value as "percentage" | "fixed" })}>
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="fixed">Fixed amount</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Value"
              required
              value={v.value}
              onChange={(e) => set({ value: e.target.value })}
              error={Boolean(errors.value)}
              helperText={errors.value}
              slotProps={{ htmlInput: { inputMode: "decimal" }, input: { [v.type === "percentage" ? "endAdornment" : "startAdornment"]: <InputAdornment position={v.type === "percentage" ? "end" : "start"}>{v.type === "percentage" ? "%" : "₹"}</InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Minimum order value" value={v.min_order_amount} onChange={(e) => set({ min_order_amount: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
          </Grid>
          {v.type === "percentage" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Maximum discount" value={v.max_discount_amount} onChange={(e) => set({ max_discount_amount: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField type="datetime-local" label="Starts" value={v.starts_at} onChange={(e) => set({ starts_at: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField type="datetime-local" label="Ends" value={v.ends_at} onChange={(e) => set({ ends_at: e.target.value })} error={Boolean(errors.ends_at)} helperText={errors.ends_at} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Total usage limit" value={v.usage_limit} onChange={(e) => set({ usage_limit: e.target.value })} helperText="Empty = unlimited" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Uses per customer" value={v.per_user_limit} onChange={(e) => set({ per_user_limit: e.target.value })} helperText="Empty = unlimited" />
          </Grid>
          <Grid size={12}>
            <TextField select label="Applies to" value={v.scope} onChange={(e) => set({ scope: e.target.value as "all" | "products" | "categories" })}>
              <MenuItem value="all">Whole order</MenuItem>
              <MenuItem value="categories">Specific categories (incl. sub-categories)</MenuItem>
              <MenuItem value="products">Specific products</MenuItem>
            </TextField>
          </Grid>
          {v.scope === "categories" && (
            <Grid size={12}>
              <SearchMulti label="Categories" value={categories} onChange={setCategories} search={(q) => adminCatalogService.categories({ q: q || undefined, limit: 30 }).then((r) => r.data.map((c) => ({ id: c.id, name: c.name })))} />
            </Grid>
          )}
          {v.scope === "products" && (
            <Grid size={12}>
              <SearchMulti label="Products" value={products} onChange={setProducts} search={(q) => adminCatalogService.products({ q: q || undefined, limit: 30 }).then((r) => r.data.map((p) => ({ id: p.id, name: p.name })))} />
            </Grid>
          )}
          <Grid size={12}>
            <FormControlLabel control={<Switch checked={v.first_order_only} onChange={(e) => set({ first_order_only: e.target.checked })} />} label="First order only" />
            <FormControlLabel control={<Switch checked={v.is_active} onChange={(e) => set({ is_active: e.target.checked })} />} label="Active" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} loading={pending} disabled={!v.code.trim() || !v.value.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CouponsPanel() {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { query } = useAnalyticsFilters();
  const [nonce, setNonce] = useState(0);
  const analytics = useAnalyticsQuery("coupons", analyticsService.coupons, query, nonce);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [state, setState] = useState("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<CouponRow | null>(null);
  const list = useQuery({
    queryKey: ["admin", "coupons", { q, state, ...paging }],
    queryFn: () => adminCouponsService.list({ q: q || undefined, state: state || undefined, ...paging }),
    placeholderData: keepPreviousData,
  });
  const usage = new Map((analytics.data?.rows ?? []).map((r) => [r.id, r]));
  const t = analytics.data?.totals;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "coupons"] });
  };

  async function toggle(c: CouponRow) {
    try {
      await adminCouponsService.update(c.id, { is_active: !c.is_active });
      notify.success(c.is_active ? "Coupon deactivated." : "Coupon activated.");
      refresh();
    } catch (err) {
      notify.error(err);
    }
  }

  const stat = (key: string, label: string, value: string | number, format: "money" | "number", note: string | null = null) => ({ key, label, value, previous: null, change_pct: null, format, lower_is_better: false, note });
  const columns: GridColDef<CouponRow>[] = [
    { field: "code", headerName: "Code", width: 140, renderCell: ({ row }) => <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace", lineHeight: "60px" }}>{row.code}</Typography> },
    { field: "offer", headerName: "Offer", flex: 1, minWidth: 200, valueGetter: (_, c) => `${c.type === "percentage" ? `${Number(c.value)}% off` : `${formatPrice(c.value)} off`}${c.min_order_amount ? ` · min ${formatPrice(c.min_order_amount)}` : ""}${c.max_discount_amount ? ` · max ${formatPrice(c.max_discount_amount)}` : ""}` },
    { field: "used_count", headerName: "Uses", width: 110, valueGetter: (_, c) => `${c.used_count}${c.usage_limit ? ` / ${c.usage_limit}` : ""}` },
    { field: "discount", headerName: "Discount (period)", width: 140, type: "number", valueGetter: (_, c) => Number(usage.get(c.id)?.discount ?? 0), valueFormatter: (v) => formatPrice(v) },
    { field: "revenue", headerName: "Revenue (period)", width: 140, type: "number", valueGetter: (_, c) => Number(usage.get(c.id)?.revenue ?? 0), valueFormatter: (v) => formatPrice(v) },
    { field: "state", headerName: "Status", width: 120, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={STATE[row.state].label} color={STATE[row.state].color} /> },
    { field: "ends_at", headerName: "Expiry", width: 170, valueGetter: (_, c) => (c.ends_at ? formatDateTime(c.ends_at) : "No expiry") },
    {
      field: "actions",
      headerName: "",
      width: 150,
      align: "right",
      renderCell: ({ row }) => (
        <>
          {hasPermission("coupons.update") && (
            <>
              <Tooltip title={row.is_active ? "Deactivate" : "Activate"}>
                <Switch size="small" checked={row.is_active} onChange={() => toggle(row)} slotProps={{ input: { "aria-label": "Active" } }} />
              </Tooltip>
              <IconButton size="small" onClick={() => setEditing(row.id)} aria-label={`Edit ${row.code}`}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </>
          )}
          {hasPermission("coupons.delete") && (
            <IconButton size="small" onClick={() => setDeleting(row)} aria-label={`Delete ${row.code}`}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Every coupon rule is checked on the server at checkout."
        action={
          hasPermission("coupons.create") && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>
              Create coupon
            </Button>
          )
        }
      />
      <AnalyticsFiltersBar applied={analytics.data?.filters} onRefresh={() => setNonce((n) => n + 1)} refreshing={analytics.isFetching} show={{}} />
      <KpiGrid>
        {!t
          ? Array.from({ length: 6 }, (_, i) => <KpiSkeleton key={i} />)
          : [
              stat("total", "Total coupons", t.total, "number"),
              stat("active", "Active now", t.active, "number"),
              stat("expired", "Expired", t.expired, "number"),
              stat("uses", "Uses in period", t.uses, "number"),
              stat("discount", "Discount given", t.discount_given, "money", "In period"),
              stat("revenue", "Revenue with coupons", t.revenue_with_coupons, "money", "Net of refunds"),
            ].map((k) => <KpiCard key={k.key} kpi={k} />)}
      </KpiGrid>
      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1.5 }}>
        All coupons
      </Typography>
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Search code">
        <TextField select size="small" label="Status" value={state} onChange={(e) => setState(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="scheduled">Scheduled</MenuItem>
          <MenuItem value="expired">Expired</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </ListToolbar>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <AdminDataGrid rows={list.data?.data ?? []} columns={columns} loading={list.isFetching} pagination={list.data?.pagination} page={paging.page} pageSize={paging.limit} onPageChange={(page, limit) => setPaging({ page, limit })} autoHeight />
      )}
      {editing !== null && (
        <CouponDialog
          key={editing}
          id={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify.success("Coupon saved.");
            refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.code ?? "coupon"}?`}
        description="Past orders keep the coupon code. It can no longer be used."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            await adminCouponsService.remove(deleting!.id);
            notify.success("Coupon deleted.");
            refresh();
          } catch (err) {
            notify.error(err);
          } finally {
            setDeleting(null);
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
