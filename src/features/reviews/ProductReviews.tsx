"use client";

import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useNotify } from "@/components/feedback/notify";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { reviewsService, type Review, type ReviewSort } from "@/services/catalog/reviews.service";
import { ReviewDialog } from "./ReviewDialog";

const PAGE_SIZE = 10;

function ReviewItem({ review, onHelpful, canVote }: { review: Review; onHelpful: () => void; canVote: boolean }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Chip size="small" color={review.rating >= 3 ? "success" : "warning"} label={`${review.rating} ★`} />
        {review.title && <Typography variant="subtitle2">{review.title}</Typography>}
      </Stack>
      {review.body && (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-line" }}>
          {review.body}
        </Typography>
      )}
      {review.images.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {review.images.map((img) => (
            <a key={img.id} href={img.lg ?? img.md ?? undefined} target="_blank" rel="noopener noreferrer">
              <Avatar variant="rounded" src={img.thumb ?? undefined} alt="Customer photo" sx={{ width: 64, height: 64 }} />
            </a>
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 1.5, color: "text.secondary", flexWrap: "wrap" }}>
        <Typography variant="caption">{review.author}</Typography>
        {review.is_verified_purchase && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <VerifiedIcon sx={{ fontSize: 14, color: "success.main" }} />
            <Typography variant="caption">Verified buyer</Typography>
          </Stack>
        )}
        <Typography variant="caption">{review.created_at ? new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</Typography>
        <Button size="small" color={review.voted_helpful ? "primary" : "inherit"} startIcon={<ThumbUpAltOutlinedIcon fontSize="small" />} onClick={onHelpful} disabled={!canVote} sx={{ ml: "auto", minHeight: 30 }}>
          Helpful{review.helpful_count ? ` (${review.helpful_count})` : ""}
        </Button>
      </Stack>
    </Box>
  );
}

/** Rating summary + distribution + reviews list + write/edit for verified buyers. */
export function ProductReviews({ slug, productName }: { slug: string; productName: string }) {
  const { status, user } = useAuth();
  const authed = status === "authenticated";
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewSort>("helpful");
  const [rating, setRating] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);

  const listKey = ["reviews", slug, { page, sort, rating, user: user?.id ?? null }];
  const { data, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => reviewsService.list(slug, { page, limit: PAGE_SIZE, sort, rating: rating ?? undefined }),
    placeholderData: keepPreviousData,
    enabled: status !== "loading",
  });
  const eligibility = useQuery({ queryKey: ["reviews", slug, "eligibility", user?.id], queryFn: () => reviewsService.eligibility(slug), enabled: authed });

  const summary = data?.meta?.summary;
  const total = summary?.count ?? 0;
  const mine = eligibility.data?.review ?? null;

  async function helpful(review: Review) {
    try {
      const result = await reviewsService.helpful(review.id);
      queryClient.setQueryData(listKey, (old: typeof data) =>
        old ? { ...old, data: old.data.map((r) => (r.id === review.id ? { ...r, voted_helpful: result.voted_helpful, helpful_count: result.helpful_count } : r)) } : old,
      );
    } catch (error) {
      notify.error(error);
    }
  }

  return (
    <Box id="reviews" component="section" aria-labelledby="reviews-title" sx={{ scrollMarginTop: 120 }}>
      <Typography id="reviews-title" variant="h5" component="h2" sx={{ mb: 2.5 }}>
        Ratings & reviews
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { md: "300px 1fr" }, gap: { xs: 3, md: 5 } }}>
        <Box>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h2" component="p" sx={{ fontWeight: 700 }}>
              {total ? summary!.average.toFixed(1) : "–"}
            </Typography>
            <Box>
              <Rating value={summary?.average ?? 0} precision={0.1} readOnly />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {total} review{total === 1 ? "" : "s"}
              </Typography>
            </Box>
          </Stack>
          <Stack spacing={0.75} sx={{ mt: 2 }}>
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = summary?.distribution[String(stars) as "1"] ?? 0;
              return (
                <Stack
                  key={stars}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", cursor: count ? "pointer" : "default" }}
                  onClick={() => count && (setRating(rating === stars ? null : stars), setPage(1))}
                >
                  <Typography variant="body2" sx={{ width: 28 }}>
                    {stars} ★
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={total ? (count / total) * 100 : 0}
                    color={stars >= 3 ? "primary" : "warning"}
                    sx={{ flex: 1, height: 8, borderRadius: 4, opacity: rating && rating !== stars ? 0.4 : 1 }}
                  />
                  <Typography variant="caption" sx={{ width: 28, textAlign: "right", color: "text.secondary" }}>
                    {count}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>

          <Box sx={{ mt: 3 }}>
            {!authed ? (
              <LinkButton href={routes.login(`${routes.product(slug)}#reviews`)} variant="outlined" fullWidth startIcon={<RateReviewOutlinedIcon />}>
                Log in to write a review
              </LinkButton>
            ) : mine ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  Your review{mine.status === "pending" ? " is awaiting approval" : mine.status === "rejected" ? " was not published" : " is published"}.
                </Typography>
                <Button variant="outlined" onClick={() => setWriting(true)}>
                  Edit your review
                </Button>
              </Stack>
            ) : eligibility.data?.can_review ? (
              <Button variant="contained" fullWidth startIcon={<RateReviewOutlinedIcon />} onClick={() => setWriting(true)}>
                Write a review
              </Button>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Only customers who received this product can review it.
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
            {rating && <Chip label={`${rating} ★ only`} onDelete={() => setRating(null)} />}
            <Box sx={{ flex: 1 }} />
            <TextField select size="small" label="Sort" value={sort} onChange={(e) => (setSort(e.target.value as ReviewSort), setPage(1))} sx={{ width: 180 }}>
              <MenuItem value="helpful">Most helpful</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="highest">Highest rated</MenuItem>
              <MenuItem value="lowest">Lowest rated</MenuItem>
            </TextField>
          </Stack>
          {isLoading ? (
            <ListSkeleton rows={3} height={100} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState icon={<RateReviewOutlinedIcon />} title={rating ? "No reviews with this rating" : "No reviews yet"} description={rating ? undefined : "Be the first to share your thoughts after your purchase."} />
          ) : (
            <Stack spacing={2.5} divider={<Divider flexItem />}>
              {data.data.map((review) => (
                <ReviewItem key={review.id} review={review} onHelpful={() => helpful(review)} canVote={authed} />
              ))}
            </Stack>
          )}
          {data && data.pagination.last_page > 1 && (
            <Stack sx={{ alignItems: "center", mt: 3 }}>
              <Pagination count={data.pagination.last_page} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
            </Stack>
          )}
        </Box>
      </Box>

      {writing && (
        <ReviewDialog
          slug={slug}
          productName={productName}
          review={mine}
          onClose={() => setWriting(false)}
          onSaved={(message) => {
            setWriting(false);
            notify.success(message);
            void queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
          }}
        />
      )}
    </Box>
  );
}
