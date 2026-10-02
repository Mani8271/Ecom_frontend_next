import { apiConfig } from "@/config/api";
import type { Query } from "@/services/api/http";

/**
 * Storefront listing URLs are short and readable: /c/men?color=black,white&size=m&price_max=1999.
 * Known keys pass through; every other key is an attribute filter (attr[code]=...).
 */
export const RESERVED_PARAMS = ["q", "sort", "page", "brand", "price_min", "price_max", "in_stock", "discount_min"] as const;

export const LISTING_PAGE_SIZE = 24;

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim().slice(0, 500) : undefined;
}

export function toApiQuery(params: SearchParams, category?: string): Query {
  const query: Query = { limit: Math.min(LISTING_PAGE_SIZE, apiConfig.maxPageSize), category };

  for (const [key, raw] of Object.entries(params)) {
    const value = first(raw);
    if (!value || key === "category" || !/^[a-z][a-z0-9_]{0,63}$/.test(key)) continue;

    if ((RESERVED_PARAMS as readonly string[]).includes(key)) {
      query[key] = value;
    } else {
      query[`attr[${key}]`] = value;
    }
  }

  return query;
}

export function currentPage(params: SearchParams): number {
  const page = Number(first(params.page) ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
