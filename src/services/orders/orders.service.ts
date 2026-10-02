import { http } from "@/services/api/http";
import { cartToken } from "@/services/cart/cart-token";
import type { PageQuery } from "@/types/api";
import { orderTokens } from "./order-tokens";
import type { CheckoutSummary, Order, OrderSummaryRow, PaymentInit, PlaceOrderInput, PlaceOrderResult, PublicTracking } from "./types";

function cartHeaders(): Record<string, string> {
  const token = cartToken.get();
  return token ? { "X-Cart-Token": token } : {};
}

/** Guests send their order token; customers are identified by their session. */
function orderHeaders(orderNumber: string): Record<string, string> {
  const token = orderTokens.get(orderNumber);
  return token ? { "X-Order-Token": token } : {};
}

export const checkoutService = {
  summary: (body: { address_id?: number; state_code?: string; payment_method?: string; email?: string }) =>
    http.post<CheckoutSummary>("/checkout/summary", body, { headers: cartHeaders() }).then((r) => r.data),

  placeOrder: (input: PlaceOrderInput, idempotencyKey: string) =>
    http.post<PlaceOrderResult>("/checkout/place-order", input, { headers: { ...cartHeaders(), "Idempotency-Key": idempotencyKey } }).then((r) => {
      if (r.data.order_token) orderTokens.set(r.data.order.order_number, r.data.order_token);
      return r.data;
    }),
};

export const ordersService = {
  list: (query: PageQuery & { status?: string } = {}) => http.paginated<OrderSummaryRow>("/orders", { query: { ...query } }),

  get: (orderNumber: string) => http.get<Order>(`/orders/${encodeURIComponent(orderNumber)}`, { headers: orderHeaders(orderNumber) }).then((r) => r.data),

  cancel: (orderNumber: string, reason: string, comment?: string) =>
    http.post<Order>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, { reason, comment }, { headers: orderHeaders(orderNumber) }).then((r) => r.data),

  verifyPayment: (orderNumber: string, payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    http.post<Order>(`/orders/${encodeURIComponent(orderNumber)}/payment/verify`, payload, { headers: orderHeaders(orderNumber) }).then((r) => r.data),

  retryPayment: (orderNumber: string) =>
    http.post<{ payment: PaymentInit }>(`/orders/${encodeURIComponent(orderNumber)}/payment/retry`, undefined, { headers: orderHeaders(orderNumber) }).then((r) => r.data.payment),

  requestReturn: (orderNumber: string, form: FormData) =>
    http.post<unknown>(`/orders/${encodeURIComponent(orderNumber)}/returns`, form, { headers: orderHeaders(orderNumber) }),

  track: (orderNumber: string, contact: string) =>
    http.post<PublicTracking>("/track-order", { order_number: orderNumber, contact }, { auth: false }).then((r) => r.data),
};
