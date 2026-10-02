"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import type { GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AdminBrand } from "@/services/admin/types";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ListToolbar } from "../components/ListToolbar";
import { Thumb } from "../components/Thumb";
import { useNotify } from "../notify";
import { BrandFormDialog } from "./BrandFormDialog";
import { useBrandList, useBrandMutations } from "./queries";

export function BrandsPanel() {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "1" | "0">("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const q = useDebouncedValue(search.trim());
  const [editing, setEditing] = useState<AdminBrand | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminBrand | null>(null);
  const { remove } = useBrandMutations();

  const query = { ...paging, q: q || undefined, sort: "name", ...(status ? { is_active: Number(status) as 0 | 1 } : {}) };
  const { data, isFetching, error, refetch } = useBrandList(query);

  const columns: GridColDef<AdminBrand>[] = [
    { field: "logo", headerName: "", width: 64, renderCell: ({ row }) => <Thumb src={row.logo?.thumb} alt={row.name} /> },
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "slug", headerName: "Slug", flex: 1, minWidth: 160 },
    { field: "products_count", headerName: "Products", width: 100, type: "number" },
    {
      field: "is_active",
      headerName: "Status",
      width: 110,
      renderCell: ({ row }) => <Chip size="small" label={row.is_active ? "Active" : "Hidden"} color={row.is_active ? "success" : "default"} variant="outlined" />,
    },
    {
      field: "actions",
      headerName: "",
      width: 110,
      align: "right",
      renderCell: ({ row }) => (
        <>
          {hasPermission("brands.update") && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setEditing(row)} aria-label={`Edit ${row.name}`}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("brands.delete") && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => setDeleting(row)} aria-label={`Delete ${row.name}`}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      notify.success("Brand deleted.");
    } catch (err) {
      notify.error(err);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Brands"
        description="Brands shoppers can filter by."
        action={
          hasPermission("brands.create") && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>
              Add brand
            </Button>
          )
        }
      />
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPaging((p) => ({ ...p, page: 1 }));
        }}
        placeholder="Search brands"
      >
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} sx={{ width: { md: 160 } }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="1">Active</MenuItem>
          <MenuItem value="0">Hidden</MenuItem>
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
          autoHeight
        />
      )}

      {editing && <BrandFormDialog key={editing === "new" ? "new" : editing.id} open brand={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "brand"}?`}
        description="Brands that still have products can't be deleted."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
