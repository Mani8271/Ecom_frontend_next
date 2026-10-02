"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryIcon from "@mui/icons-material/History";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { inventoryService } from "@/services/admin/analytics.service";
import type { InventoryRow, StockState } from "@/services/admin/analytics.types";
import { adminCatalogService } from "@/services/admin/catalog.service";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { EntityPicker, pickerSearch, type PickerOption } from "../components/EntityPicker";
import { ListToolbar } from "../components/ListToolbar";
import { Thumb } from "../components/Thumb";
import { StockDialog } from "./StockDialog";

export const STOCK_STATE: Record<StockState, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  in: { label: "In stock", color: "success" },
  low: { label: "Low stock", color: "warning" },
  out: { label: "Out of stock", color: "error" },
  discontinued: { label: "Discontinued", color: "default" },
};

/** Variant stock table. `mode` fixes the list to low / out of stock pages. */
export function InventoryTable({ mode = "all" }: { mode?: "all" | "low" | "out" }) {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState<PickerOption | null>(null);
  const [sort, setSort] = useState(mode === "all" ? "name" : "available");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [managing, setManaging] = useState<InventoryRow | null>(null);
  const canUpdate = hasPermission("inventory.update");

  const query = { ...paging, q: q || undefined, sort, category_id: category?.id, stock: mode === "all" ? stock || undefined : undefined };
  const fetcher = mode === "low" ? inventoryService.lowStock : mode === "out" ? inventoryService.outOfStock : inventoryService.list;
  const { data, isFetching, error, refetch } = useQuery({ queryKey: ["admin", "inventory", mode, query], queryFn: () => fetcher(query), placeholderData: keepPreviousData });

  async function toggleProduct(row: InventoryRow) {
    try {
      await adminCatalogService.updateProductStatus(row.product_id, row.product_status === "active" ? "draft" : "active");
      notify.success(row.product_status === "active" ? "Product deactivated (draft)." : "Product activated.");
      void refetch();
    } catch (err) {
      notify.error(err);
    }
  }

  const columns: GridColDef<InventoryRow>[] = [
    { field: "image", headerName: "", width: 60, renderCell: ({ row }) => <Thumb src={row.image} alt={row.product_name} /> },
    {
      field: "product_name",
      headerName: "Product",
      flex: 2,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.product_name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {row.sku}
            {row.variant_title ? ` · ${row.variant_title}` : ""}
          </Typography>
        </Box>
      ),
    },
    { field: "category", headerName: "Category", width: 130 },
    { field: "on_hand", headerName: "Stock", width: 80, type: "number" },
    { field: "reserved", headerName: "Reserved", width: 90, type: "number" },
    { field: "available", headerName: "Available", width: 95, type: "number" },
    { field: "sold", headerName: "Sold", width: 75, type: "number" },
    { field: "low_stock_threshold", headerName: "Reorder at", width: 95, type: "number" },
    ...(mode !== "all" ? [{ field: "recommended_reorder", headerName: "Suggested reorder", width: 140, type: "number" } as GridColDef<InventoryRow>] : []),
    { field: "stock_state", headerName: "Status", width: 125, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={STOCK_STATE[row.stock_state].label} color={STOCK_STATE[row.stock_state].color} /> },
    { field: "price", headerName: "Price", width: 100, type: "number", valueGetter: (_, row) => Number(row.price), valueFormatter: (v) => formatPrice(v) },
    { field: "inventory_value", headerName: "Value", width: 115, type: "number", valueGetter: (_, row) => Number(row.inventory_value), valueFormatter: (v) => formatPrice(v) },
    {
      field: "actions",
      headerName: "",
      width: mode === "out" ? 250 : 140,
      align: "right",
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 0.5 }}>
          {canUpdate && (
            <Button size="small" variant="outlined" onClick={() => setManaging(row)}>
              {mode === "all" ? "Manage" : "Restock"}
            </Button>
          )}
          {mode === "out" && hasPermission("products.update") && (
            <Button size="small" onClick={() => toggleProduct(row)}>
              {row.product_status === "active" ? "Deactivate" : "Activate"}
            </Button>
          )}
          <Tooltip title="Stock history">
            <IconButton size="small" component={NextLink} href={`${routes.admin.inventoryHistory}?q=${encodeURIComponent(row.sku)}`} aria-label="Stock history">
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit product">
            <IconButton size="small" component={NextLink} href={routes.admin.product(row.product_id, "variants")} aria-label="Edit product">
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Search product or SKU">
        {mode === "all" && (
          <TextField select size="small" label="Status" value={stock} onChange={(e) => (setStock(e.target.value), setPaging((p) => ({ ...p, page: 1 })))} sx={{ minWidth: 150 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="in">In stock</MenuItem>
            <MenuItem value="low">Low stock</MenuItem>
            <MenuItem value="out">Out of stock</MenuItem>
            <MenuItem value="discontinued">Discontinued</MenuItem>
          </TextField>
        )}
        <Box sx={{ minWidth: 200 }}>
          <EntityPicker size="small" label="Category" entity="categories" search={pickerSearch.categories} value={category} onChange={(v) => (setCategory(v), setPaging((p) => ({ ...p, page: 1 })))} />
        </Box>
        <TextField select size="small" label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="name">Product name</MenuItem>
          <MenuItem value="available">Lowest available</MenuItem>
          <MenuItem value="-available">Highest available</MenuItem>
          <MenuItem value="sold">Most sold</MenuItem>
          <MenuItem value="value">Highest value</MenuItem>
        </TextField>
      </ListToolbar>
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <AdminDataGrid
          getRowId={(row) => row.variant_id}
          rows={data?.data ?? []}
          columns={columns}
          loading={isFetching}
          pagination={data?.pagination}
          page={paging.page}
          pageSize={paging.limit}
          onPageChange={(page, limit) => setPaging({ page, limit })}
          autoHeight
          localeText={{ noRowsLabel: mode === "low" ? "No low-stock variants 🎉" : mode === "out" ? "Nothing is out of stock" : "No variants found" }}
        />
      )}
      {managing && (
        <StockDialog
          row={managing}
          onClose={() => setManaging(null)}
          onSaved={() => {
            setManaging(null);
            notify.success("Stock updated.");
            void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
            void queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
          }}
        />
      )}
    </>
  );
}
