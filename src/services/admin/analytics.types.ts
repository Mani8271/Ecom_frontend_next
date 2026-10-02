/** Mirrors backend AnalyticsService / ReportService / admin commerce controllers. Money = decimal strings. */

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month" | "this_year" | "last_year" | "all" | "custom";
export type Granularity = "day" | "month" | "year";

export interface AnalyticsQuery {
  range?: RangeKey;
  from?: string;
  to?: string;
  granularity?: Granularity;
  category_id?: number;
  brand_id?: number;
  payment_method?: "cod" | "online";
  status?: string;
  fresh?: 1;
}

export interface AppliedFilters {
  range: RangeKey;
  from: string;
  to: string;
  previous_from: string;
  previous_to: string;
  granularity: Granularity;
  timezone: string;
}

export interface Kpi {
  key: string;
  label: string;
  value: string | number;
  previous: string | number | null;
  change_pct: number | null;
  format: "money" | "number";
  lower_is_better: boolean;
  note: string | null;
}

export interface RecentOrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  items: number;
  grand_total: string;
  status: string;
  status_label: string;
  payment_status: string;
  payment_method: "cod" | "online";
  placed_at: string;
}

export interface DashboardSummary {
  filters: AppliedFilters;
  kpis: Kpi[];
  recent_orders: RecentOrderRow[];
}

export interface SalesPoint {
  period: string;
  orders: number;
  revenue: string;
  aov: string;
}

export interface SalesAnalytics {
  filters: AppliedFilters;
  series: SalesPoint[];
  totals: {
    revenue: string;
    orders: number;
    aov: string;
    units: number;
    previous_revenue: string | null;
    previous_orders: number | null;
    revenue_growth_pct: number | null;
    orders_growth_pct: number | null;
  };
}

export interface OrdersAnalytics {
  filters: AppliedFilters;
  totals: Record<"total" | "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded" | "unpaid_attempts", number>;
  distribution: { status: string; label: string; count: number; value: string }[];
  recent: RecentOrderRow[];
}

export interface TopCustomer {
  id: number;
  name: string;
  email: string;
  orders: number;
  total_spent: string;
  aov: string;
  last_order_at: string;
  customer_since: string;
}

export interface CustomerAnalytics {
  filters: AppliedFilters;
  totals: {
    total: number;
    new: number;
    new_previous: number;
    active: number;
    active_previous: number;
    repeat: number;
    guest_orders: number;
    customer_revenue: string;
    average_spend: string;
  };
  growth: { period: string; new_customers: number }[];
  top_customers: TopCustomer[];
}

export interface ProductPerformanceRow {
  id: number;
  name: string;
  slug: string;
  status: string;
  brand: string | null;
  category: string | null;
  units_sold: number;
  revenue: string;
  orders: number;
  wishlist_count: number;
  rating: number;
  reviews: number;
  stock: number;
}

export interface GroupRow {
  id: number;
  name: string;
  products: number;
  units_sold: number;
  orders: number;
  revenue: string;
  previous_revenue: string;
  growth_pct: number | null;
  share_pct: number;
  average_rating: number | null;
}

export interface GroupPerformance {
  filters: AppliedFilters;
  rows: GroupRow[];
  total_revenue: string;
  highlights: Record<"top_by_revenue" | "fastest_growth" | "lowest_revenue", { name: string; metric: string; value: string | number } | null>;
}

export interface PaymentAnalytics {
  filters: AppliedFilters;
  totals: {
    paid: string;
    pending_amount: string;
    pending_count: number;
    failed_amount: string;
    failed_count: number;
    refunded: string;
    cod: string;
    online: string;
    online_success_rate: number | null;
    online_attempts: number;
  };
  methods: { method: string; label: string; count: number; amount: string }[];
}

export interface VariantStockRow {
  variant_id: number;
  product_id: number;
  product: string;
  sku: string;
  variant_title: string | null;
}

export interface InventoryTotals {
  skus: number;
  units: number;
  reserved: number;
  value_at_price: string;
  value_at_cost: string | null;
  variants_missing_cost: number;
  low_stock: number;
  out_of_stock: number;
  discontinued: number;
}

export interface InventoryAnalytics {
  filters: AppliedFilters;
  totals: InventoryTotals;
  fast_moving: (VariantStockRow & { units_sold: number; available: number })[];
  slow_moving: (VariantStockRow & { units_sold: number; available: number })[];
  recently_restocked: (VariantStockRow & { added: number; on_hand: number; at: string })[];
}

export interface CouponAnalytics {
  filters: AppliedFilters;
  totals: { total: number; active: number; expired: number; uses: number; discount_given: string; revenue_with_coupons: string };
  rows: { id: number; code: string; uses: number; uses_all_time: number; discount: string; revenue: string; is_active: boolean; ends_at: string | null; expired: boolean }[];
}

export interface ReviewAnalytics {
  totals: { total: number; approved: number; pending: number; rejected: number; average_rating: number };
  distribution: { stars: number; count: number }[];
  highest_rated: { id: number; name: string; slug: string; rating: number; reviews: number }[];
  lowest_rated: { id: number; name: string; slug: string; rating: number; reviews: number }[];
}

export interface FinancialSummary {
  filters: AppliedFilters;
  orders: number;
  gross_sales: string;
  product_discounts: string;
  coupon_discounts: string;
  shipping_revenue: string;
  tax_collected: string;
  refunds: string;
  net_sales: string;
  net_sales_ex_tax: string;
  profit: { available: true; cost_of_goods: string; gross_profit: string } | { available: false; reason: string };
  formulas: Record<string, string>;
}

// ---------------------------------------------------------------- inventory

export type StockState = "in" | "low" | "out" | "discontinued";

export interface InventoryRow {
  variant_id: number;
  product_id: number;
  product_name: string;
  product_status: string;
  category: string | null;
  sku: string;
  variant_title: string | null;
  options: { name: string; value: string }[];
  image: string | null;
  price: string;
  cost_price: string | null;
  status: string;
  on_hand: number;
  reserved: number;
  sold: number;
  available: number;
  low_stock_threshold: number;
  inventory_value: string;
  stock_state: StockState;
  recommended_reorder: number;
}

export interface StockMovement {
  id: number;
  at: string;
  variant_id: number;
  product_id: number | null;
  product: string | null;
  sku: string | null;
  variant_title: string | null;
  type: string;
  action: string;
  previous_stock: number;
  change: number;
  new_stock: number;
  reserved_after: number;
  reason: string | null;
  admin: string | null;
}

export type StockAction = "restock" | "damage" | "adjust" | "set";

// ---------------------------------------------------------------- reports

export interface ReportColumn {
  key: string;
  label: string;
  type: "text" | "money" | "number" | "date" | "datetime";
}

export interface ReportMeta {
  title: string;
  columns: ReportColumn[];
  sorts: string[];
  sort: string;
  totals: Record<string, string | number> | null;
  totals_note: string | null;
  filters: AppliedFilters;
}
