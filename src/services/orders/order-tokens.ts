/**
 * Guest orders: the per-order access token returned once at checkout. Kept in
 * the browser so a guest can reopen, pay and track the order on this device.
 */
const KEY = "gk_order_tokens";
const MAX = 20;

function read(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export const orderTokens = {
  get(orderNumber: string): string | null {
    return read()[orderNumber.toUpperCase()] ?? null;
  },
  set(orderNumber: string, token: string): void {
    try {
      const entries = Object.entries({ ...read(), [orderNumber.toUpperCase()]: token }).slice(-MAX);
      window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // ignore
    }
  },
};
