import { siteConfig } from "@/config/site";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: siteConfig.currency, maximumFractionDigits: 2, minimumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** "₹1,299" — API money values are decimal strings. */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? currency.format(amount) : "—";
}

/** "₹999" or "₹999 – ₹1,499". */
export function formatPriceRange(min: string | number | null | undefined, max: string | number | null | undefined): string {
  if (min === null || min === undefined) return "—";
  return max !== null && max !== undefined && Number(max) !== Number(min) ? `${formatPrice(min)} – ${formatPrice(max)}` : formatPrice(min);
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : "—";
}

interface AddressLike {
  line1?: string | null;
  line2?: string | null;
  area?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postal_code?: string | null;
}

/** Address as display lines: house/street, area/landmark, city/district, state + PIN. */
export function formatAddressLines(a: AddressLike): string[] {
  const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(", ");
  return [
    join(a.line1, a.line2),
    join(a.area, a.landmark ? `Near ${a.landmark}` : null),
    join(a.city, a.district && a.district !== a.city ? `${a.district} Dist.` : null),
    [a.state, a.postal_code].filter(Boolean).join(" – "),
  ].filter(Boolean);
}

const compactNumber = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

/** "₹4.8L", "₹1.2Cr" style for chart axes and dense cards. */
export function formatCompactPrice(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `₹${compactNumber.format(amount)}` : "—";
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
}

/** Chart period labels: 2026-09-30 → "30 Sep", 2026-09 → "Sep 2026", 2026 → "2026". */
export function formatPeriod(period: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return new Date(`${period}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (/^\d{4}-\d{2}$/.test(period)) return new Date(`${period}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  return period;
}
