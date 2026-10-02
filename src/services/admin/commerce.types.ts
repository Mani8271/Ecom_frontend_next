import type { Order, OrderSummaryRow, ReturnSummary } from "@/services/orders/types";

export interface AdminOrderRow extends OrderSummaryRow {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
}

export interface AdminOrder extends Order {
  id: number;
  user: { id: number; name: string; email: string; phone: string | null } | null;
  next_statuses: { value: string; label: string }[];
  history: { from: string | null; to: string; label: string; comment: string | null; visible_to_customer: boolean; actor: string | null; at: string | null }[];
  payments: {
    id: number;
    gateway: string;
    gateway_order_id: string | null;
    gateway_payment_id: string | null;
    transaction_id: string | null;
    method: string | null;
    amount: string;
    refunded_amount: string;
    status: string;
    failure_reason: string | null;
    paid_at: string | null;
    created_at: string | null;
  }[];
  refunds: {
    id: number;
    amount: string;
    status: string;
    gateway: string | null;
    gateway_refund_id: string | null;
    reference: string | null;
    reason: string | null;
    failure_reason: string | null;
    processed_at: string | null;
    created_at: string | null;
  }[];
  refundable_amount: string;
  ip_address: string | null;
  created_at: string | null;
}

export interface AdminReturnRow extends ReturnSummary {
  id: number;
  order_id: number;
  order_number: string | null;
  customer_name: string | null;
}

export interface AdminReturn extends ReturnSummary {
  id: number;
  order_id: number;
  order_number: string;
  items: { order_item_id: number; name: string | null; variant_title: string | null; image: string | null; quantity: number; refund_amount: string }[];
  photos: { thumb: string | null; lg: string | null }[];
  timeline: { label: string; at: string }[];
  customer: { name: string; email: string; phone: string };
  next_statuses: { value: string; label: string }[];
  can_refund: boolean;
  refund: { id: number; amount: string; status: string; reference: string | null } | null;
}

export interface RefundRow {
  id: number;
  reference_number: string;
  order_id: number;
  order_number: string | null;
  customer: string | null;
  amount: string;
  reason: string | null;
  payment_method: string | null;
  gateway: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  manual: boolean;
  gateway_refund_id: string | null;
  reference: string | null;
  failure_reason: string | null;
  processed_at: string | null;
  created_at: string | null;
}

export interface PaymentRow {
  id: number;
  order_id: number;
  order_number: string | null;
  customer: string | null;
  gateway: string;
  method: string | null;
  gateway_payment_id: string | null;
  transaction_id: string | null;
  amount: string;
  refunded_amount: string;
  status: string;
  status_label: string;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface CustomerRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "blocked";
  orders_count: number;
  total_spent: string;
  created_at: string | null;
}

export interface CustomerDetail extends CustomerRow {
  date_of_birth: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at: string | null;
  reviews_count: number;
  wishlist_count: number;
  addresses: import("@/services/account/types").Address[];
  recent_orders: (OrderSummaryRow & { id: number })[];
}

export interface CouponRow {
  id: number;
  code: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: string;
  min_order_amount: string | null;
  max_discount_amount: string | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  used_count: number;
  first_order_only: boolean;
  scope: "all" | "products" | "categories";
  is_active: boolean;
  state: "active" | "inactive" | "expired" | "scheduled" | "used_up";
  created_at: string | null;
}

export interface CouponDetail extends CouponRow {
  products: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  total_discount_given: string;
}

export type CouponInput = Partial<Omit<CouponRow, "id" | "used_count" | "state" | "created_at">> & { product_ids?: number[]; category_ids?: number[] };

export interface AdminReviewRow {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  user: { id: number; name: string; email: string } | null;
  product: { id: number; name: string; slug: string } | null;
  images: { thumb: string | null; lg: string | null }[];
  created_at: string | null;
}

export type StoreSettings = Record<string, string | number | boolean | null>;
