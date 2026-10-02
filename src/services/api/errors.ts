import type { ApiErrorBody, FieldErrors } from "@/types/api";

/** Every failed API call is normalized to this error. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors: FieldErrors = {},
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromBody(status: number, body: Partial<ApiErrorBody> | null): ApiError {
    return new ApiError(
      status,
      body?.code ?? (status >= 500 ? "SERVER_ERROR" : "HTTP_ERROR"),
      body?.message ?? defaultMessage(status),
      body?.errors ?? {},
      body?.request_id,
    );
  }

  static network(): ApiError {
    return new ApiError(0, "NETWORK_ERROR", "We couldn't reach the server. Check your connection and try again.");
  }

  get isValidation(): boolean {
    return this.status === 422 && Object.keys(this.errors).length > 0;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** A message that is always safe and friendly to show to a user. */
export function userMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.status >= 500 ? defaultMessage(500) : error.message;
  }
  return defaultMessage(500);
}

function defaultMessage(status: number): string {
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return "The request could not be completed.";
}
