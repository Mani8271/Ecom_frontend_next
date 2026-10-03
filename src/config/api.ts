// const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://backend.pminfotechsolutions.in/api/v1";
export const apiConfig = {
  /** Browser → API. */
  publicUrl: publicApiUrl,
  /** Next.js server → API (may be a private address). Undefined in the browser bundle. */
  internalUrl: process.env.API_INTERNAL_URL ?? publicApiUrl,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export function apiBaseUrl(): string {
  return typeof window === "undefined" ? apiConfig.internalUrl : apiConfig.publicUrl;
}
