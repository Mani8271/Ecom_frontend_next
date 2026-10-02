"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import type { GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { ATTRIBUTE_TYPES, type AdminAttribute, type AttributeType } from "@/services/admin/types";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ListToolbar } from "../components/ListToolbar";
import { useNotify } from "../notify";
import { AttributeFormDialog, TYPE_LABELS } from "./AttributeFormDialog";
import { useAttributeList, useAttributeMutations } from "./queries";

export function AttributesPanel() {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AttributeType | "">("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const q = useDebouncedValue(search.trim());
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminAttribute | null>(null);
  const { remove } = useAttributeMutations();

  const { data, isFetching, error, refetch } = useAttributeList({ ...paging, q: q || undefined, type: type || undefined, sort: "position" });

  const columns: GridColDef<AdminAttribute>[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "code", headerName: "Code", flex: 1, minWidth: 140 },
    { field: "type", headerName: "Type", width: 170, valueGetter: (_, row) => TYPE_LABELS[row.type] },
    { field: "options_count", headerName: "Options", width: 90, type: "number" },
    {
      field: "flags",
      headerName: "Used for",
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ height: "100%", alignItems: "center" }}>
          {row.can_be_variant_axis && <Chip size="small" color="primary" variant="outlined" label="Variants" />}
          {row.is_filterable && <Chip size="small" variant="outlined" label="Filters" />}
          {row.is_searchable && <Chip size="small" variant="outlined" label="Search" />}
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 110,
      align: "right",
      renderCell: ({ row }) => (
        <>
          {hasPermission("attributes.update") && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setEditing(row.id)} aria-label={`Edit ${row.name}`}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("attributes.delete") && (
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
      notify.success("Attribute deleted.");
    } catch (err) {
      notify.error(err);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Attributes"
        description="Product properties such as Size, Color, Fabric, RAM or Pack size. Assign them to categories to build the product form."
        action={
          hasPermission("attributes.create") && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>
              Add attribute
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
        placeholder="Search by name or code"
      >
        <TextField
          select
          size="small"
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as AttributeType | "");
            setPaging((p) => ({ ...p, page: 1 }));
          }}
          sx={{ width: { md: 200 } }}
        >
          <MenuItem value="">All types</MenuItem>
          {ATTRIBUTE_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {TYPE_LABELS[t]}
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
          autoHeight
        />
      )}

      {editing !== null && <AttributeFormDialog key={editing} attributeId={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "attribute"}?`}
        description="Attributes used by products can't be deleted. Remove it from categories first if you only want to hide it from product forms."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
