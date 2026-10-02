import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError, userMessage } from "@/services/api/errors";

/**
 * Maps a backend 422 response onto form fields. Returns a message for the
 * form-level alert when the error is not tied to known fields.
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]): string | null {
  if (isApiError(error) && error.isValidation) {
    let unmatched = false;

    for (const [field, messages] of Object.entries(error.errors)) {
      if ((fields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: "server", message: messages[0] });
      } else {
        unmatched = true;
      }
    }

    return unmatched ? error.message : null;
  }

  return userMessage(error);
}

/** Optional text inputs: send `null` instead of an empty string. */
export function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

/** Optional number inputs (kept as strings in forms): "" -> null. */
export function numberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
