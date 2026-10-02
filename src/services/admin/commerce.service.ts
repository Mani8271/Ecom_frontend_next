import { http, type Query } from "@/services/api/http";
import type { Paginated, PageQuery } from "@/types/api";
import type {
  AdminOrder,
  AdminOrderRow,
  AdminReturn,
  AdminReturnRow,
  AdminReviewRow,
  CouponDetail,
  CouponInput,
  CouponRow,
  CustomerDetail,
  CustomerRow,
  PaymentRow,
  RefundRow,
  StoreSettings,
} from "./commerce.types";

const q = (query: object): Query => ({ ...(query as Query) });

/** Admin commerce endpoints (/api/v1/admin/*). The API checks each permission. */
export const adminOrdersService = {
  list: (query: PageQuery & { status?: string; payment_status?: string; payment_method?: string; date_from?: string; date_to?: string; customer_id?: number } = {}) =>
    http.paginated<AdminOrderRow>("/admin/orders", { query: q(query) }) as Promise<Paginated<AdminOrderRow> & { meta?: { statuses: { value: string; label: string }[] } }>,
  get: (id: number) => http.get<AdminOrder>(`/admin/orders/${id}`).then((r) => r.data),
  updateStatus: (id: number, status: string, comment?: string) => http.patch<AdminOrder>(`/admin/orders/${id}/status`, { status, comment }).then((r) => r.data),
  saveShipment: (id: number, input: { carrier: string; tracking_number?: string; tracking_url?: string; expected_delivery_date?: string; mark_shipped?: boolean }) =>
    http.post<AdminOrder>(`/admin/orders/${id}/shipment`, input).then((r) => r.data),
  cancel: (id: number, reason: string) => http.post<AdminOrder>(`/admin/orders/${id}/cancel`, { reason }).then((r) => r.data),
  refund: (id: number, input: { amount: number; reason: string; reference?: string }) => http.post<AdminOrder>(`/admin/orders/${id}/refunds`, input).then((r) => r.data),
  processRefund: (refundId: number, reference: string) => http.post<AdminOrder>(`/admin/refunds/${refundId}/process`, { reference }).then((r) => r.data),
};

export const adminReturnsService = {
  list: (query: PageQuery & { status?: string } = {}) => http.paginated<AdminReturnRow>("/admin/returns", { query: q(query) }),
  get: (id: number) => http.get<AdminReturn>(`/admin/returns/${id}`).then((r) => r.data),
  updateStatus: (id: number, status: string, note?: string) => http.patch<AdminReturn>(`/admin/returns/${id}/status`, { status, note }).then((r) => r.data),
  refund: (id: number, input: { amount?: number; reference?: string } = {}) => http.post<AdminReturn>(`/admin/returns/${id}/refund`, input).then((r) => r.data),
};

export const adminPaymentsService = {
  list: (query: PageQuery & { status?: string; gateway?: string; from?: string; to?: string } = {}) => http.paginated<PaymentRow>("/admin/payments", { query: q(query) }),
  refunds: (query: PageQuery & { status?: string; from?: string; to?: string } = {}) => http.paginated<RefundRow>("/admin/refunds", { query: q(query) }),
};

export const adminCustomersService = {
  list: (query: PageQuery & { status?: string } = {}) => http.paginated<CustomerRow>("/admin/customers", { query: q(query) }),
  get: (id: number) => http.get<CustomerDetail>(`/admin/customers/${id}`).then((r) => r.data),
  setStatus: (id: number, status: "active" | "blocked") => http.patch<CustomerRow>(`/admin/customers/${id}`, { status }).then((r) => r.data),
};

export const adminCouponsService = {
  list: (query: PageQuery & { state?: string } = {}) => http.paginated<CouponRow>("/admin/coupons", { query: q(query) }),
  get: (id: number) => http.get<CouponDetail>(`/admin/coupons/${id}`).then((r) => r.data),
  create: (input: CouponInput) => http.post<CouponRow>("/admin/coupons", input),
  update: (id: number, input: CouponInput) => http.patch<CouponRow>(`/admin/coupons/${id}`, input),
  remove: (id: number) => http.delete(`/admin/coupons/${id}`),
};

export const adminReviewsService = {
  list: (query: PageQuery & { status?: string; rating?: number } = {}) =>
    http.paginated<AdminReviewRow>("/admin/reviews", { query: q(query) }) as Promise<Paginated<AdminReviewRow> & { meta?: { pending_count: number } }>,
  moderate: (id: number, status: "approved" | "rejected" | "pending", reason?: string) => http.patch<AdminReviewRow>(`/admin/reviews/${id}/status`, { status, reason }),
  remove: (id: number) => http.delete(`/admin/reviews/${id}`),
};

export const adminSettingsService = {
  get: () => http.get<StoreSettings>("/admin/settings").then((r) => r.data),
  save: (settings: StoreSettings) => http.put<StoreSettings>("/admin/settings", { settings }).then((r) => r.data),
};
