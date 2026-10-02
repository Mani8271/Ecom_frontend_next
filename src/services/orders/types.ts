/** Mirrors backend OrderResource / ReturnResource / checkout responses. */

import type { Cart } from "@/services/cart/types";

export type OrderStatus =
  | "payment_pending"
  | "placed"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refunded";

export type PaymentMethodCode = "online" | "cod";

export interface PaymentOption {
  method: PaymentMethodCode;
  label: string;
  description: string;
  available: boolean;
  reason: string | null;
}

export interface CheckoutSummary extends Cart {
  payment_methods: PaymentOption[];
  delivery_estimate: { min_date: string; max_date: string };
}

export interface OrderSummaryRow {
  order_number: string;
  status: OrderStatus;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  payment_method: PaymentMethodCode;
  payment_method_label: string;
  grand_total: string;
  item_count: number;
  preview_images: string[];
  first_item_name: string | null;
  placed_at: string | null;
  expected_delivery_date: string | null;
  delivered_at: string | null;
  is_guest: boolean;
}

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  state: "done" | "current" | "upcoming";
  at: string | null;
}

export interface Tracking {
  current_status: OrderStatus;
  current_label: string;
  steps: TrackingStep[];
  events: { status: OrderStatus; label: string; comment: string | null; at: string | null }[];
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_slug: string | null;
  name: string;
  variant_title: string | null;
  options: Record<string, string>;
  sku: string;
  image: string | null;
  quantity: number;
  unit_price: string;
  compare_at_price: string | null;
  discount_amount: string;
  tax_rate: string;
  line_total: string;
  qty_cancelled: number;
  qty_returned: number;
  returnable_quantity: number;
  can_review: boolean;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address_type?: string;
  line1: string;
  line2: string | null;
  area?: string | null;
  landmark: string | null;
  city: string;
  district?: string | null;
  state: string;
  state_code: string | null;
  postal_code: string;
}

export interface ReturnSummary {
  rma_number: string;
  status: string;
  status_label: string;
  reason: string;
  description: string | null;
  admin_note: string | null;
  refund_amount: string;
  item_count: number | null;
  requested_at: string | null;
}

export interface Order extends OrderSummaryRow {
  items: OrderItem[];
  totals: {
    mrp_total: string;
    product_discount: string;
    subtotal: string;
    coupon_discount: string;
    coupon_code: string | null;
    shipping: string;
    cod_fee: string;
    tax_included: string;
    grand_total: string;
    refunded: string;
  };
  shipping_address: ShippingAddress;
  customer: { name: string; email: string; phone: string };
  payment: {
    gateway: string;
    method: string | null;
    status: string;
    status_label: string;
    amount: string;
    transaction_id: string | null;
    paid_at: string | null;
    failure_reason: string | null;
  } | null;
  shipment: { carrier: string; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null; delivered_at: string | null } | null;
  tracking: Tracking;
  cancellation: { reason: string | null; cancelled_by: string | null; cancelled_at: string | null } | null;
  refunds: { amount: string; status: string; reason: string | null; processed_at: string | null; created_at: string | null }[];
  returns: ReturnSummary[];
  actions: {
    can_cancel: boolean;
    cancel_reasons: string[];
    can_pay: boolean;
    can_return: boolean;
    return_window_ends_at: string | null;
    return_reasons: string[];
  };
  notes: string | null;
}

/** What the browser needs to open the payment screen (no secrets). */
export interface PaymentInit {
  gateway: "razorpay" | "cod" | string;
  key_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name: string; email: string; contact: string };
  error?: string;
}

export interface PlaceOrderResult {
  order: Order;
  payment: PaymentInit | null;
  order_token: string | null;
}

export interface PlaceOrderInput {
  payment_method: PaymentMethodCode;
  address_id?: number;
  address?: Record<string, unknown>;
  contact?: { name?: string; email: string; phone: string };
  notes?: string;
  expected_total?: string;
}

export interface PublicTracking {
  order_number: string;
  status: OrderStatus;
  status_label: string;
  placed_at: string | null;
  expected_delivery_date: string | null;
  item_count: number;
  items: { name: string; variant_title: string | null; image: string | null; quantity: number }[];
  shipment: { carrier: string; tracking_number: string | null; tracking_url: string | null } | null;
  shipping_address: { name: string | null; city: string | null; state: string | null; postal_code: string | null };
  tracking: Tracking;
}
