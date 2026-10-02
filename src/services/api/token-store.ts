/**
 * The access token lives only in memory (never localStorage), so XSS cannot
 * read a persisted token. The long-lived refresh token is an HttpOnly cookie.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },

  set(token: string | null): void {
    accessToken = token;
    listeners.forEach((listener) => listener(token));
  },

  clear(): void {
    tokenStore.set(null);
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
