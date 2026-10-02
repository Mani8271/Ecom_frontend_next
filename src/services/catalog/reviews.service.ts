import { http } from "@/services/api/http";
import type { PageQuery } from "@/types/api";
import type { CardImage } from "./types";

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  images: (CardImage & { id: number })[];
  created_at: string | null;
  updated_at: string | null;
  voted_helpful?: boolean;
  // Owner view only
  status?: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  product?: { id: number; name: string; slug: string; image: CardImage | null } | null;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface ReviewEligibility {
  can_review: boolean;
  has_purchased: boolean;
  review: Review | null;
}

export type ReviewSort = "helpful" | "newest" | "highest" | "lowest";

export const reviewsService = {
  list: (slug: string, query: PageQuery & { rating?: number; sort?: ReviewSort; with_photos?: 1 } = {}) =>
    http.paginated<Review>(`/products/${encodeURIComponent(slug)}/reviews`, { query: { ...query } }) as Promise<
      Awaited<ReturnType<typeof http.paginated<Review>>> & { meta?: { summary?: ReviewSummary } }
    >,
  eligibility: (slug: string) => http.get<ReviewEligibility>(`/products/${encodeURIComponent(slug)}/reviews/eligibility`).then((r) => r.data),
  create: (slug: string, form: FormData) => http.post<Review>(`/products/${encodeURIComponent(slug)}/reviews`, form),
  update: (id: number, form: FormData) => http.post<Review>(`/reviews/${id}`, form),
  remove: (id: number) => http.delete(`/reviews/${id}`),
  helpful: (id: number) => http.post<{ voted_helpful: boolean; helpful_count: number }>(`/reviews/${id}/helpful`).then((r) => r.data),
  mine: (query: PageQuery = {}) => http.paginated<Review>("/account/reviews", { query: { ...query } }),
};
