"use client";

import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Pagination from "@mui/material/Pagination";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useNotify } from "@/components/feedback/notify";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { reviewsService, type Review } from "@/services/catalog/reviews.service";
import { ReviewDialog } from "./ReviewDialog";

const STATUS: Record<string, { label: string; color: "success" | "warning" | "default" }> = {
  approved: { label: "Published", color: "success" },
  pending: { label: "Awaiting approval", color: "warning" },
  rejected: { label: "Not published", color: "default" },
};

export function MyReviews() {
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [pending, setPending] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reviews", "mine", page],
    queryFn: () => reviewsService.mine({ page, limit: 10 }),
    placeholderData: keepPreviousData,
  });

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    try {
      await reviewsService.remove(deleting.id);
      notify.success("Review deleted.");
      void refetch();
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader title="My reviews" description="Reviews you've written. You can review products after they're delivered." />
      {isLoading ? (
        <ListSkeleton rows={3} height={110} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<RateReviewOutlinedIcon />}
          title="No reviews yet"
          description="After your order is delivered, open it and tap “Rate & review”."
          action={
            <LinkButton href={routes.account.orders} variant="contained">
              Go to orders
            </LinkButton>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {data.data.map((review) => (
            <Stack key={review.id} direction="row" spacing={2} sx={{ p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
              <Avatar variant="rounded" src={review.product?.image?.thumb ?? undefined} sx={{ width: 64, height: 80 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {review.product && (
                  <Link component={NextLink} href={routes.product(review.product.slug)} variant="subtitle2" sx={{ color: "text.primary" }}>
                    {review.product.name}
                  </Link>
                )}
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", my: 0.5 }}>
                  <Rating value={review.rating} readOnly size="small" />
                  {review.status && <Chip size="small" variant="outlined" label={STATUS[review.status].label} color={STATUS[review.status].color} />}
                </Stack>
                {review.title && <Typography variant="body2" sx={{ fontWeight: 600 }}>{review.title}</Typography>}
                {review.body && (
                  <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
                    {review.body}
                  </Typography>
                )}
                {review.rejection_reason && (
                  <Typography variant="caption" sx={{ color: "warning.main" }}>
                    {review.rejection_reason}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" onClick={() => setEditing(review)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => setDeleting(review)}>
                    Delete
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ))}
          {data.pagination.last_page > 1 && (
            <Stack sx={{ alignItems: "center", pt: 2 }}>
              <Pagination count={data.pagination.last_page} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
            </Stack>
          )}
        </Stack>
      )}
      {editing?.product && (
        <ReviewDialog
          slug={editing.product.slug}
          productName={editing.product.name}
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            notify.success(message);
            void refetch();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} title="Delete this review?" confirmLabel="Delete" destructive pending={pending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </>
  );
}
