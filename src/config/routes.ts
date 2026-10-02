/** Every internal URL is built here so paths are never hardcoded in components. */
export const routes = {
  home: "/",
  search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : "/search"),
  category: (slug: string) => `/c/${slug}`,
  product: (slug: string) => `/p/${slug}`,
  cart: "/cart",
  checkout: "/checkout",
  orderPlaced: (orderNumber: string) => `/checkout/success/${orderNumber}`,
  trackOrder: (orderNumber?: string) => (orderNumber ? `/track-order/${orderNumber}` : "/track-order"),
  wishlist: "/wishlist",

  login: (next?: string) => (next ? `/login?next=${encodeURIComponent(next)}` : "/login"),
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",

  help: {
    shipping: "/help/shipping",
    returns: "/help/returns",
    contact: "/help/contact",
  },

  account: {
    root: "/account",
    profile: "/account/profile",
    addresses: "/account/addresses",
    security: "/account/security",
    orders: "/account/orders",
    order: (orderNumber: string) => `/account/orders/${orderNumber}`,
    wishlist: "/account/wishlist",
    reviews: "/account/reviews",
    settings: "/account/settings",
  },

  admin: {
    root: "/admin",
    categories: "/admin/categories",
    attributes: "/admin/attributes",
    brands: "/admin/brands",
    products: "/admin/products",
    newProduct: "/admin/products/new",
    product: (id: number, tab?: "details" | "variants" | "images") => `/admin/products/${id}${tab && tab !== "details" ? `?tab=${tab}` : ""}`,
    analytics: "/admin/analytics",
    orders: "/admin/orders",
    order: (id: number) => `/admin/orders/${id}`,
    customers: "/admin/customers",
    customer: (id: number) => `/admin/customers/${id}`,
    payments: "/admin/payments",
    inventory: "/admin/inventory",
    inventoryHistory: "/admin/inventory/history",
    lowStock: "/admin/inventory/low-stock",
    outOfStock: "/admin/inventory/out-of-stock",
    coupons: "/admin/coupons",
    reviews: "/admin/reviews",
    returns: "/admin/returns",
    refunds: "/admin/refunds",
    reports: "/admin/reports",
    report: (type: string) => `/admin/reports/${type}`,
    settings: "/admin/settings",
  },
} as const;

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeRedirectPath(next: string | null | undefined, fallback: string = routes.home): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
