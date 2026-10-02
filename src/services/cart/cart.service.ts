import { http } from "@/services/api/http";
import { cartToken } from "./cart-token";
import type { Cart } from "./types";

/** Sends the guest bag token (ignored by the API when the customer is logged in). */
function headers(): Record<string, string> {
  const token = cartToken.get();
  return token ? { "X-Cart-Token": token } : {};
}

/** Remember a newly created guest bag. */
function keepToken(cart: Cart): Cart {
  if (cart.cart_token) cartToken.set(cart.cart_token);
  return cart;
}

export const cartService = {
  get: () => http.get<Cart>("/cart", { headers: headers() }).then((r) => r.data),

  add: (variantId: number, quantity = 1) =>
    http.post<Cart>("/cart/items", { variant_id: variantId, quantity }, { headers: headers() }).then((r) => ({ cart: keepToken(r.data), message: r.message })),

  update: (itemId: number, quantity: number) => http.patch<Cart>(`/cart/items/${itemId}`, { quantity }, { headers: headers() }).then((r) => r.data),

  remove: (itemId: number) => http.delete<Cart>(`/cart/items/${itemId}`, { headers: headers() }).then((r) => r.data),

  clear: () => http.delete<Cart>("/cart", { headers: headers() }).then((r) => r.data),

  applyCoupon: (code: string) => http.post<Cart>("/cart/coupon", { code }, { headers: headers() }).then((r) => r.data),

  removeCoupon: () => http.delete<Cart>("/cart/coupon", { headers: headers() }).then((r) => r.data),

  moveToWishlist: (itemId: number) => http.post<Cart>(`/cart/items/${itemId}/move-to-wishlist`).then((r) => r.data),

  /** After login: fold the guest bag into the account bag. */
  merge: () => http.post<Cart>("/cart/merge", undefined, { headers: headers() }).then((r) => r.data),
};
