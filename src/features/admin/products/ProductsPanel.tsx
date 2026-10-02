"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatPriceRange } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { PRODUCT_STATUSES, type AdminProductRow, type ProductListQuery, type ProductStatus } from "@/services/admin/types";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EntityPicker, pickerSearch, type PickerOption } from "../components/EntityPicker";
import { ListToolbar } from "../components/ListToolbar";
import { Thumb } from "../components/Thumb";
import { useNotify } from "../notify";
import { ProductStatusChip } from "./ProductStatusChip";
import { useProductList, useProductMutations } from "./queries";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
] as const;

export function ProductsPanel() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [filters, setFilters] = useState<{ status: ProductStatus | ""; stock: "" | "in_stock" | "out_of_stock"; sort: string }>({ status: "", stock: "", sort: "newest" });
  const [category, setCategory] = useState<PickerOption | null>(null);
  const [brand, setBrand] = useState<PickerOption | null>(null);
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [deleting, setDeleting] = useState<AdminProductRow | null>(null);
  const { remove } = useProductMutations();

  const query: ProductListQuery = {
    ...paging,
    q: q || undefined,
    sort: filters.sort,
    status: filters.status || undefined,
    stock: filters.stock || undefined,
    category_id: category?.id,
    brand_id: brand?.id,
  };
  const { data, isFetching, error, refetch } = useProductList(query);
  const resetPage = () => setPaging((p) => ({ ...p, page: 1 }));

  const columns: GridColDef<AdminProductRow>[] = [
    { field: "thumbnail", headerName: "", width: 64, renderCell: ({ row }) => <Thumb src={row.thumbnail?.thumb} alt={row.name} /> },
    {
      field: "name",
      headerName: "Product",
      flex: 2,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {[row.style_code, row.brand?.name].filter(Boolean).join(" · ") || "—"}
          </Typography>
        </Box>
      ),
    },
    { field: "category", headerName: "Category", flex: 1, minWidth: 130, valueGetter: (_, row) => row.primary_category?.name },
    { field: "price", headerName: "Price", width: 150, valueGetter: (_, row) => formatPriceRange(row.min_price, row.max_price) },
    {
      field: "total_stock",
      headerName: "Stock",
      width: 90,
      type: "number",
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ color: row.in_stock ? "text.primary" : "error.main", fontWeight: row.in_stock ? 400 : 600, lineHeight: "60px" }}>
          {row.total_stock ?? 0}
        </Typography>
      ),
    },
    { field: "variants_count", headerName: "Variants", width: 90, type: "number" },
    { field: "status", headerName: "Status", width: 110, renderCell: ({ row }) => <ProductStatusChip status={row.status} /> },
    {
      field: "flags",
      headerName: "",
      width: 110,
      renderCell: ({ row }) => (row.is_featured ? <Chip size="small" label="Featured" color="secondary" variant="outlined" /> : null),
    },
    { field: "updated_at", headerName: "Updated", width: 170, valueGetter: (_, row) => formatDateTime(row.updated_at) },
    {
      field: "actions",
      headerName: "",
      width: 60,
      align: "right",
      renderCell: ({ row }) =>
        hasPermission("products.delete") && (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setDeleting(row);
              }}
              aria-label={`Delete ${row.name}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
    },
  ];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      notify.success("Product deleted.");
    } catch (err) {
      notify.error(err);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Click a product to edit its details, variants, stock and images."
        action={
          hasPermission("products.create") && (
            <LinkButton href={routes.admin.newProduct} variant="contained" startIcon={<AddIcon />}>
              Add product
            </LinkButton>
          )
        }
      />
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          resetPage();
        }}
        placeholder="Search name, style code or SKU"
      >
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(e) => {
            setFilters((f) => ({ ...f, status: e.target.value as ProductStatus | "" }));
            resetPage();
          }}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          {PRODUCT_STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Stock"
          value={filters.stock}
          onChange={(e) => {
            setFilters((f) => ({ ...f, stock: e.target.value as typeof filters.stock }));
            resetPage();
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="in_stock">In stock</MenuItem>
          <MenuItem value="out_of_stock">Out of stock</MenuItem>
        </TextField>
        <Box sx={{ minWidth: 200 }}>
          <EntityPicker
            size="small"
            label="Category"
            entity="categories"
            search={pickerSearch.categories}
            value={category}
            onChange={(value) => {
              setCategory(value);
              resetPage();
            }}
          />
        </Box>
        <Box sx={{ minWidth: 180 }}>
          <EntityPicker
            size="small"
            label="Brand"
            entity="brands"
            search={pickerSearch.brands}
            value={brand}
            onChange={(value) => {
              setBrand(value);
              resetPage();
            }}
          />
        </Box>
        <TextField select size="small" label="Sort" value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} sx={{ minWidth: 170 }}>
          {SORTS.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
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
          onRowClick={({ row }) => router.push(routes.admin.product(row.id))}
          autoHeight
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "product"}?`}
        description="The product is removed from the store. Past orders keep their own copy of the product details."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
