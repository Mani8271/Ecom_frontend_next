/**
 * Guest bag id. It only identifies a shopping bag (no account access), so it
 * may live in localStorage; it is merged into the account after login.
 */
const KEY = "gk_cart_token";

export const cartToken = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      // Private mode: the bag lasts for this page view only.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};
