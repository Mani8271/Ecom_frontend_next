"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/feedback/ErrorState";
import { routes } from "@/config/routes";
import { OrderStatusChip } from "@/features/orders/components/OrderStatusChip";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { adminOrdersService } from "@/services/admin/commerce.service";
import type { AdminOrderRow } from "@/services/admin/commerce.types";
import type { OrderStatus } from "@/services/orders/types";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";

export function OrdersPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [filters, setFilters] = useState({ status: "", payment_status: "", payment_method: "", date_from: "", date_to: "", sort: "newest" });
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const set = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPaging((p) => ({ ...p, page: 1 }));
  };

  const query = Object.fromEntries(Object.entries({ ...filters, ...paging, q }).filter(([, v]) => v !== "" && v !== undefined));
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "orders", "list", query],
    queryFn: () => adminOrdersService.list(query),
    placeholderData: keepPreviousData,
  });

  const columns: GridColDef<AdminOrderRow>[] = [
    { field: "order_number", headerName: "Order", width: 110, renderCell: ({ row }) => <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: "60px" }}>{row.order_number}</Typography> },
    {
      field: "customer_name",
      headerName: "Customer",
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {row.customer_name} {row.is_guest && <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>(guest)</Typography>}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
            {row.customer_phone}
          </Typography>
        </Box>
      ),
    },
    { field: "item_count", headerName: "Items", width: 70, type: "number" },
    { field: "grand_total", headerName: "Amount", width: 120, type: "number", valueGetter: (_, row) => Number(row.grand_total), valueFormatter: (v) => formatPrice(v) },
    { field: "payment_method", headerName: "Payment", width: 150, valueGetter: (_, row) => `${row.payment_method === "cod" ? "COD" : "Online"} · ${row.payment_status_label}` },
    { field: "status", headerName: "Status", width: 150, renderCell: ({ row }) => <OrderStatusChip status={row.status as OrderStatus} label={row.status_label} /> },
    { field: "placed_at", headerName: "Date", width: 170, valueGetter: (_, row) => formatDateTime(row.placed_at ?? row.created_at) },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Click an order to update its status, add tracking, cancel or refund." />
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Order no., name, email or phone">
        <TextField select size="small" label="Status" value={filters.status} onChange={(e) => set({ status: e.target.value })} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {data?.meta?.statuses.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Payment" value={filters.payment_method} onChange={(e) => set({ payment_method: e.target.value })} sx={{ minWidth: 130 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="cod">COD</MenuItem>
        </TextField>
        <TextField select size="small" label="Payment status" value={filters.payment_status} onChange={(e) => set({ payment_status: e.target.value })} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="success">Paid</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
          <MenuItem value="partially_refunded">Partially refunded</MenuItem>
        </TextField>
        <TextField size="small" type="date" label="From" value={filters.date_from} onChange={(e) => set({ date_from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="date" label="To" value={filters.date_to} onChange={(e) => set({ date_to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
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
          onRowClick={({ row }) => router.push(routes.admin.order(row.id))}
          autoHeight
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      )}
    </>
  );
}
