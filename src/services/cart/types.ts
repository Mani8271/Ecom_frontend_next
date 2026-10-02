/** Mirrors backend QuotePresenter / CartController responses. */

export interface CartLineIssue {
  code: "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | "PRICE_CHANGED";
  message: string;
}

export interface CartLine {
  id: number | null;
  variant_id: number;
  product: { id: number; name: string; slug: string; brand: string | null };
  sku: string;
  variant_title: string | null;
  options: { name: string; value: string }[];
  image: { thumb: string | null; sm: string | null; md: string | null; lg: string | null; alt: string | null } | null;
  quantity: number;
  max_quantity: number;
  unit_price: string;
  compare_at_price: string | null;
  discount_pct: number;
  line_subtotal: string;
  coupon_discount: string;
  in_stock: boolean;
  available: number;
  issues: CartLineIssue[];
}

export interface CartTotals {
  mrp_total: string;
  product_discount: string;
  subtotal: string;
  coupon_discount: string;
  shipping: string;
  cod_fee: string;
  tax_included: string;
  grand_total: string;
  total_savings: string;
  free_shipping_above: string;
  amount_to_free_shipping: string;
}

export interface Cart {
  cart_token: string | null;
  items: CartLine[];
  item_count: number;
  coupon: { code: string; description: string | null } | null;
  coupon_error: { code: string; message: string } | null;
  totals: CartTotals | null;
  can_checkout: boolean;
}
