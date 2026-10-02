"use client";

import { DataGrid, type DataGridProps, type GridPaginationModel, type GridValidRowModel } from "@mui/x-data-grid";
import { apiConfig } from "@/config/api";
import type { PaginationMeta } from "@/types/api";

export const ADMIN_PAGE_SIZES = [20, 50, 100];

interface AdminDataGridProps<R extends GridValidRowModel> extends Omit<DataGridProps<R>, "pagination" | "paginationModel" | "onPaginationModelChange" | "rowCount"> {
  pagination?: PaginationMeta;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

/**
 * Server-paginated DataGrid. `page` is 1-based (API convention); the grid is
 * 0-based. Sorting and filtering are done by the API, never client-side.
 */
export function AdminDataGrid<R extends GridValidRowModel>({ pagination, page, pageSize, onPageChange, sx, ...props }: AdminDataGridProps<R>) {
  const model: GridPaginationModel = { page: page - 1, pageSize };

  return (
    <DataGrid<R>
      paginationMode="server"
      sortingMode="server"
      filterMode="server"
      rowCount={pagination?.total ?? 0}
      paginationModel={model}
      onPaginationModelChange={(next) => onPageChange(next.pageSize === pageSize ? next.page + 1 : 1, Math.min(next.pageSize, apiConfig.maxPageSize))}
      pageSizeOptions={ADMIN_PAGE_SIZES}
      disableColumnFilter
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      rowHeight={60}
      sx={{ bgcolor: "background.paper", "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" }, ...sx }}
      {...props}
    />
  );
}
