/** Report catalogue (plain module: used by server pages and client views). */
export const REPORTS: { type: string; title: string; description: string }[] = [
  { type: "sales", title: "Sales report", description: "Every counted order with subtotal, discounts, coupon, GST, shipping, total and refunds." },
  { type: "orders", title: "Orders report", description: "All orders (incl. cancelled) with customer, city, payment and status." },
  { type: "revenue", title: "Revenue report", description: "Revenue per day / month: gross, discounts, shipping, GST, refunds, net." },
  { type: "products", title: "Product report", description: "Units sold, orders, revenue, rating and stock per product." },
  { type: "inventory", title: "Inventory report", description: "SKU-level stock, reserved, available, sold, cost, price and value." },
  { type: "customers", title: "Customer report", description: "Orders, spend, average order value and last order per customer." },
  { type: "payments", title: "Payment report", description: "Payment attempts with method, gateway IDs, amount and status." },
  { type: "refunds", title: "Refund report", description: "Refunds with order, amount, reason, method and status." },
  { type: "coupons", title: "Coupon report", description: "Coupon uses, discount given and revenue from coupon orders." },
  { type: "gst", title: "Tax / GST report", description: "Taxable value, rate and CGST / SGST / IGST per order line, with HSN." },
];
