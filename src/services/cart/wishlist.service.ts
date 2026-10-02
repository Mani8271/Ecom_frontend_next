import { http } from "@/services/api/http";
import type { ProductCard } from "@/services/catalog/types";
import type { PageQuery } from "@/types/api";

export interface WishlistEntry extends ProductCard {
  variant: { id: number; title: string | null } | null;
  available: boolean;
  added_at: string | null;
}

export const wishlistService = {
  ids: () => http.get<{ product_ids: number[] }>("/wishlist/ids").then((r) => r.data.product_ids),
  list: (query: PageQuery = {}) => http.paginated<WishlistEntry>("/wishlist", { query: { ...query } }),
  add: (productId: number, variantId?: number | null) =>
    http.post<{ product_ids: number[] }>("/wishlist", { product_id: productId, variant_id: variantId ?? null }).then((r) => r.data.product_ids),
  remove: (productId: number) => http.delete<{ product_ids: number[] }>(`/wishlist/${productId}`).then((r) => r.data.product_ids),
  merge: (productIds: number[]) => http.post<{ product_ids: number[] }>("/wishlist/merge", { product_ids: productIds }).then((r) => r.data.product_ids),
  moveToCart: (productId: number, variantId?: number | null) =>
    http.post<{ product_ids: number[] }>(`/wishlist/${productId}/move-to-cart`, variantId ? { variant_id: variantId } : {}).then((r) => r.data.product_ids),
};

/** Guest wishlist: product ids kept in the browser until login. */
const KEY = "gk_wishlist";

export const guestWishlist = {
  get(): number[] {
    if (typeof window === "undefined") return [];
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)).slice(0, 200) : [];
    } catch {
      return [];
    }
  },
  set(ids: number[]): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 200)));
    } catch {
      // ignore
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};
