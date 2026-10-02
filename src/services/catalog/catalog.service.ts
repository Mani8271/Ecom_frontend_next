import { http, type Query } from "@/services/api/http";
import type { Paginated } from "@/types/api";
import type { Category, CategoryDetail, Facet, ProductCard, ProductDetail } from "./types";

/** Public catalog reads. Called from Server Components; responses are cached briefly by Next.js. */
const cached = (seconds: number) => ({ auth: false, next: { revalidate: seconds, tags: ["catalog"] } });

export type ProductListing = Paginated<ProductCard> & { meta?: { facets?: Facet[]; sort?: string } };

export const catalogService = {
  products: (query: Query) => http.paginated<ProductCard>("/products", { query, ...cached(30) }) as Promise<ProductListing>,

  product: (slug: string) => http.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, cached(60)),

  related: (slug: string, limit = 8) => http.paginated<ProductCard>(`/products/${encodeURIComponent(slug)}/related`, { query: { limit }, ...cached(300) }),

  similar: (slug: string, limit = 8) => http.get<ProductCard[]>(`/products/${encodeURIComponent(slug)}/similar`, { query: { limit }, ...cached(300) }),

  boughtTogether: (slug: string, limit = 4) =>
    http.get<ProductCard[]>(`/products/${encodeURIComponent(slug)}/bought-together`, { query: { limit }, ...cached(600) }),

  bestSellers: (limit = 8) => http.get<ProductCard[]>("/recommendations/bestsellers", { query: { limit }, ...cached(300) }),

  trending: (limit = 8) => http.get<ProductCard[]>("/recommendations/trending", { query: { limit }, ...cached(300) }),

  categoryTree:(depth = 1, limit = 12) => http.paginated<Category>("/categories/tree", { query: { depth, limit }, ...cached(300) }),

  category: (slug: string) => http.get<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`, cached(300)),
};
