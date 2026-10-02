"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { analyticsService } from "@/services/admin/analytics.service";
import { adminReviewsService } from "@/services/admin/commerce.service";
import type { AdminReviewRow } from "@/services/admin/commerce.types";
import { ChartCard } from "../analytics/charts";
import { Section } from "../analytics/CommandCenter";
import { KpiCard, KpiGrid, KpiSkeleton } from "../analytics/KpiCard";
import { useAnalyticsQuery } from "../analytics/useAnalyticsQuery";
import { AdminDataGrid } from "../components/AdminDataGrid";
import { ListToolbar } from "../components/ListToolbar";

const STATUS = { pending: "warning", approved: "success", rejected: "default" } as const;

function RatedList({ items }: { items: { id: number; name: string; rating: number; reviews: number }[] }) {
  if (items.length === 0) return <Typography variant="body2" sx={{ color: "text.secondary" }}>No approved reviews yet.</Typography>;
  return (
    <Stack spacing={1}>
      {items.map((p) => (
        <Stack key={p.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Link component={NextLink} href={routes.admin.product(p.id)} variant="body2" sx={{ flex: 1, minWidth: 0, color: "text.primary", fontWeight: 600 }} noWrap>
            {p.name}
          </Link>
          <Rating value={p.rating} precision={0.1} readOnly size="small" />
          <Typography variant="caption" sx={{ color: "text.secondary", width: 90, textAlign: "right" }}>
            {p.rating.toFixed(2)} ({p.reviews})
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export function ReviewsPanel() {
  const { hasPermission } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const analytics = useAnalyticsQuery("reviews", analyticsService.reviews, {}, 0);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [status, setStatus] = useState("pending");
  const [rating, setRating] = useState("");
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [deleting, setDeleting] = useState<AdminReviewRow | null>(null);
  const list = useQuery({
    queryKey: ["admin", "reviews", { q, status, rating, ...paging }],
    queryFn: () => adminReviewsService.list({ q: q || undefined, status: status || undefined, rating: rating ? Number(rating) : undefined, ...paging }),
    placeholderData: keepPreviousData,
  });
  const t = analytics.data?.totals;
  const canModerate = hasPermission("reviews.moderate");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "reviews"] });
  };

  async function moderate(row: AdminReviewRow, next: "approved" | "rejected") {
    try {
      await adminReviewsService.moderate(row.id, next, next === "rejected" ? "Does not meet our review guidelines" : undefined);
      notify.success(next === "approved" ? "Review approved and published." : "Review rejected.");
      refresh();
    } catch (err) {
      notify.error(err);
    }
  }

  const stat = (key: string, label: string, value: string | number, note: string | null = null) => ({ key, label, value, previous: null, change_pct: null, format: "number" as const, lower_is_better: false, note });
  const maxBar = Math.max(1, ...(analytics.data?.distribution.map((d) => d.count) ?? [1]));

  const columns: GridColDef<AdminReviewRow>[] = [
    {
      field: "review",
      headerName: "Review",
      flex: 2,
      minWidth: 320,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1, display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Rating value={row.rating} readOnly size="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {row.title}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {row.body}
          </Typography>
        </Box>
      ),
    },
    {
      field: "product",
      headerName: "Product",
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) =>
        row.product ? (
          <Link component={NextLink} href={routes.admin.product(row.product.id)} variant="body2" sx={{ lineHeight: "80px" }}>
            {row.product.name}
          </Link>
        ) : null,
    },
    { field: "user", headerName: "Customer", width: 160, valueGetter: (_, r) => r.user?.name ?? "—" },
    {
      field: "images",
      headerName: "Photos",
      width: 110,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", height: "100%" }}>
          {row.images.slice(0, 3).map((img, i) => (
            <a key={i} href={img.lg ?? undefined} target="_blank" rel="noopener noreferrer">
              <Avatar variant="rounded" src={img.thumb ?? undefined} sx={{ width: 28, height: 28 }} />
            </a>
          ))}
        </Stack>
      ),
    },
    { field: "status", headerName: "Status", width: 110, renderCell: ({ row }) => <Chip size="small" variant="outlined" label={row.status} color={STATUS[row.status]} /> },
    { field: "created_at", headerName: "Date", width: 160, valueGetter: (_, r) => formatDateTime(r.created_at) },
    {
      field: "actions",
      headerName: "",
      width: 130,
      align: "right",
      renderCell: ({ row }) =>
        canModerate && (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {row.status !== "approved" && (
              <Tooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => moderate(row, "approved")} aria-label="Approve">
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {row.status !== "rejected" && (
              <Tooltip title="Reject">
                <IconButton size="small" color="warning" onClick={() => moderate(row, "rejected")} aria-label="Reject">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => setDeleting(row)} aria-label="Delete">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Reviews" description="Only customers with a delivered order can review. Approve reviews to publish them; ratings update automatically." />
      <KpiGrid>
        {!t
          ? Array.from({ length: 5 }, (_, i) => <KpiSkeleton key={i} />)
          : [
              stat("total", "Total reviews", t.total),
              stat("avg", "Average rating", t.average_rating ? t.average_rating.toFixed(2) : "—", "Approved reviews"),
              stat("pending", "Awaiting approval", t.pending),
              stat("approved", "Approved", t.approved),
              stat("rejected", "Rejected", t.rejected),
            ].map((k) => <KpiCard key={k.key} kpi={k} />)}
      </KpiGrid>
      <Section columns={{ lg: "repeat(3, minmax(0, 1fr))" }}>
        <ChartCard title="Rating distribution" subtitle="Approved reviews" loading={analytics.isLoading} error={analytics.error} height={180}>
          <Stack spacing={1}>
            {analytics.data?.distribution.map((d) => (
              <Stack key={d.stars} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="body2" sx={{ width: 32 }}>
                  {d.stars} ★
                </Typography>
                <LinearProgress variant="determinate" value={(d.count / maxBar) * 100} color={d.stars >= 3 ? "primary" : "warning"} sx={{ flex: 1, height: 10, borderRadius: 5 }} />
                <Typography variant="caption" sx={{ width: 32, textAlign: "right" }}>
                  {d.count}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </ChartCard>
        <ChartCard title="Highest rated" subtitle="By average approved rating" loading={analytics.isLoading} error={analytics.error} height={180}>
          {analytics.data && <RatedList items={analytics.data.highest_rated} />}
        </ChartCard>
        <ChartCard title="Lowest rated" subtitle="By average approved rating" loading={analytics.isLoading} error={analytics.error} height={180}>
          {analytics.data && <RatedList items={analytics.data.lowest_rated} />}
        </ChartCard>
      </Section>
      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1.5 }}>
        Moderation
      </Typography>
      <ListToolbar search={search} onSearch={(v) => (setSearch(v), setPaging((p) => ({ ...p, page: 1 })))} placeholder="Search text or product">
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
        <TextField select size="small" label="Rating" value={rating} onChange={(e) => setRating(e.target.value)} sx={{ minWidth: 110 }}>
          <MenuItem value="">All</MenuItem>
          {[5, 4, 3, 2, 1].map((r) => (
            <MenuItem key={r} value={String(r)}>
              {r} ★
            </MenuItem>
          ))}
        </TextField>
      </ListToolbar>
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <AdminDataGrid rows={list.data?.data ?? []} columns={columns} loading={list.isFetching} pagination={list.data?.pagination} page={paging.page} pageSize={paging.limit} onPageChange={(page, limit) => setPaging({ page, limit })} rowHeight={80} autoHeight />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this review?"
        description="The product rating is recalculated."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            await adminReviewsService.remove(deleting!.id);
            notify.success("Review deleted.");
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
