import { apiBaseUrl } from "@/config/api";
import type { ApiErrorBody, ApiSuccess, Paginated } from "@/types/api";
import { ApiError } from "./errors";
import { refreshSession } from "./session";
import { tokenStore } from "./token-store";

type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the in-memory access token (browser only). Default true. */
  auth?: boolean;
  signal?: AbortSignal;
  /** Next.js fetch caching for server-side calls. */
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
}

/**
 * The only place that talks HTTP to the API. Works in Server Components
 * (public, cacheable reads) and in the browser (authenticated calls with
 * transparent access-token refresh).
 */
async function request<TEnvelope>(method: string, path: string, options: RequestOptions = {}, retried = false): Promise<TEnvelope> {
  const isBrowser = typeof window !== "undefined";
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };

  const token = isBrowser && options.auth !== false ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      signal: options.signal,
      // The refresh cookie is scoped to /auth; other calls don't need cookies.
      credentials: path.startsWith("/auth/") ? "include" : "same-origin",
      cache: options.cache,
      next: options.next,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw ApiError.network();
  }

  const payload = await parseJson(response);

  if (response.ok) {
    return payload as TEnvelope;
  }

  const error = ApiError.fromBody(response.status, payload as ApiErrorBody | null);

  // Expired access token: refresh once, then replay the request.
  if (isBrowser && token && error.code === "TOKEN_EXPIRED" && !retried) {
    const session = await refreshSession();
    if (session) return request<TEnvelope>(method, path, options, true);
  }

  throw error;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(apiBaseUrl() + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return url.toString();
}

async function parseJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Authenticated file download (CSV exports): returns the blob and the server's filename. */
async function download(path: string, query?: Query, retried = false): Promise<{ blob: Blob; filename: string | null }> {
  const token = tokenStore.get();
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { headers: { Accept: "*/*", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  } catch {
    throw ApiError.network();
  }

  if (!response.ok) {
    const error = ApiError.fromBody(response.status, (await parseJson(response)) as ApiErrorBody | null);
    if (token && error.code === "TOKEN_EXPIRED" && !retried && (await refreshSession())) return download(path, query, true);
    throw error;
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  return { blob: await response.blob(), filename: /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? null };
}

export const http = {
  download,
  get: <T>(path: string, options?: RequestOptions) => request<ApiSuccess<T>>("GET", path, options),
  paginated: <T>(path: string, options?: RequestOptions) => request<Paginated<T>>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<ApiSuccess<T>>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<ApiSuccess<T>>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<ApiSuccess<T>>("PATCH", path, { ...options, body }),
  delete: <T = null>(path: string, options?: RequestOptions) => request<ApiSuccess<T>>("DELETE", path, options),
};
