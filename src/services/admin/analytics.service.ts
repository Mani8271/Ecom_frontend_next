import { http, type Query } from "@/services/api/http";
import type { Paginated, PageQuery } from "@/types/api";
import type {
  AnalyticsQuery,
  CouponAnalytics,
  CustomerAnalytics,
  DashboardSummary,
  FinancialSummary,
  GroupPerformance,
  InventoryAnalytics,
  InventoryRow,
  OrdersAnalytics,
  PaymentAnalytics,
  ProductPerformanceRow,
  ReportMeta,
  ReviewAnalytics,
  SalesAnalytics,
  StockAction,
  StockMovement,
} from "./analytics.types";

const q = (query: object): Query => ({ ...(query as Query) });
const get = <T>(path: string, query: AnalyticsQuery) => http.get<T>(`/admin/dashboard/${path}`, { query: q(query) }).then((r) => r.data);

/** Server-side aggregates for the admin command centre. */
export const analyticsService = {
  summary: (query: AnalyticsQuery) => get<DashboardSummary>("summary", query),
  sales: (query: AnalyticsQuery) => get<SalesAnalytics>("sales", query),
  orders: (query: AnalyticsQuery) => get<OrdersAnalytics>("orders", query),
  customers: (query: AnalyticsQuery) => get<CustomerAnalytics>("customers", query),
  categories: (query: AnalyticsQuery) => get<GroupPerformance>("categories", query),
  brands: (query: AnalyticsQuery) => get<GroupPerformance>("brands", query),
  payments: (query: AnalyticsQuery) => get<PaymentAnalytics>("payments", query),
  inventory: (query: AnalyticsQuery) => get<InventoryAnalytics>("inventory", query),
  coupons: (query: AnalyticsQuery) => get<CouponAnalytics>("coupons", query),
  reviews: (query: AnalyticsQuery) => get<ReviewAnalytics>("reviews", query),
  financial: (query: AnalyticsQuery) => get<FinancialSummary>("financial", query),
  products: (query: AnalyticsQuery & PageQuery & { sort?: string }) => http.paginated<ProductPerformanceRow>("/admin/dashboard/products", { query: q(query) }),
};

export const inventoryService = {
  list: (query: PageQuery & { stock?: string; category_id?: number } = {}) => http.paginated<InventoryRow>("/admin/inventory", { query: q(query) }),
  lowStock: (query: PageQuery = {}) => http.paginated<InventoryRow>("/admin/inventory/low-stock", { query: q(query) }),
  outOfStock: (query: PageQuery = {}) => http.paginated<InventoryRow>("/admin/inventory/out-of-stock", { query: q(query) }),
  history: (query: PageQuery & { type?: string; from?: string; to?: string; variant_id?: number; actor_id?: number } = {}) =>
    http.paginated<StockMovement>("/admin/inventory/history", { query: q(query) }) as Promise<Paginated<StockMovement> & { meta?: { types?: Record<string, string> } }>,
  adjust: (variantId: number, input: { action: StockAction; quantity: number; reason: string; low_stock_threshold?: number | null }) =>
    http.patch<{ on_hand: number; available: number }>(`/admin/inventory/${variantId}`, input),
  setThreshold: (variantId: number, threshold: number | null) => http.patch(`/admin/inventory/${variantId}`, { low_stock_threshold: threshold }),
};

export const reportsService = {
  get: (type: string, query: AnalyticsQuery & PageQuery & { sort?: string }) =>
    http.paginated<Record<string, string | number | null>>(`/admin/reports/${type}`, { query: q(query) }) as Promise<Paginated<Record<string, string | number | null>> & { meta: ReportMeta }>,

  /** Downloads the CSV with the admin's session (a plain link can't send the bearer token). */
  async download(type: string, query: AnalyticsQuery & { q?: string; sort?: string }): Promise<void> {
    const { blob, filename } = await http.download(`/admin/reports/${type}`, q({ ...query, export: "csv" }));
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename ?? `${type}-report.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
