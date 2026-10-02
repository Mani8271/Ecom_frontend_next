import { apiConfig } from "@/config/api";
import type { ApiSuccess } from "@/types/api";
import type { AuthPayload } from "@/services/auth/types";
import { tokenStore } from "./token-store";

type SessionListener = (payload: AuthPayload | null) => void;

const sessionListeners = new Set<SessionListener>();
let inFlight: Promise<AuthPayload | null> | null = null;

/** Notified whenever a refresh succeeds (new user data) or fails (signed out). */
export function onSessionChange(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

/**
 * Exchanges the HttpOnly refresh cookie for a new access token.
 *
 * Single-flight: concurrent callers share one request. Across tabs, the Web
 * Locks API serializes refreshes; a 409 (another tab just rotated the cookie)
 * is retried once.
 */
export function refreshSession(): Promise<AuthPayload | null> {
  if (!inFlight) {
    inFlight = withCrossTabLock(() => doRefresh()).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function doRefresh(attempt = 0): Promise<AuthPayload | null> {
  let response: Response;
  try {
    response = await fetch(`${apiConfig.publicUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    });
  } catch {
    // Offline: keep the current state, the next request will try again.
    return null;
  }

  if (response.status === 409 && attempt === 0) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return doRefresh(1);
  }

  if (!response.ok) {
    tokenStore.clear();
    sessionListeners.forEach((listener) => listener(null));
    return null;
  }

  const body = (await response.json()) as ApiSuccess<AuthPayload>;
  tokenStore.set(body.data.access_token);
  sessionListeners.forEach((listener) => listener(body.data));
  return body.data;
}

async function withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request("gk-auth-refresh", task);
  }
  return task();
}
