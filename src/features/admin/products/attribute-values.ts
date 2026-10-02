import type { AttributeValue, EffectiveAttribute } from "@/services/admin/types";

/**
 * Spec values as the form edits them. Inputs keep strings; conversion to the
 * API shape happens once, on submit.
 */
export type AttributeFormValue = string | boolean | number[] | { min: string; max: string };
export type AttributeFormValues = Record<string, AttributeFormValue>;

export function emptyFormValue(attribute: EffectiveAttribute): AttributeFormValue {
  switch (attribute.type) {
    case "multiselect":
      return [];
    case "range":
      return { min: "", max: "" };
    default:
      return "";
  }
}

export function toFormValue(attribute: EffectiveAttribute, value: AttributeValue | undefined): AttributeFormValue {
  if (value === undefined || value === null) return emptyFormValue(attribute);

  switch (attribute.type) {
    case "multiselect":
      return Array.isArray(value) ? value : [];
    case "range":
      return typeof value === "object" && !Array.isArray(value) ? { min: String(value.min), max: String(value.max) } : { min: "", max: "" };
    case "boolean":
      return value === true ? "yes" : value === false ? "no" : "";
    default:
      return String(value);
  }
}

/** Returns undefined for "not set" (the key is then left out of the request). */
export function toApiValue(attribute: EffectiveAttribute, value: AttributeFormValue | undefined): AttributeValue | undefined {
  if (value === undefined) return undefined;

  switch (attribute.type) {
    case "multiselect":
      return Array.isArray(value) && value.length > 0 ? value : undefined;
    case "range": {
      if (typeof value !== "object" || Array.isArray(value) || (value.min === "" && value.max === "")) return undefined;
      return { min: Number(value.min), max: Number(value.max) };
    }
    case "boolean":
      return value === "yes" ? true : value === "no" ? false : undefined;
    case "number":
      return value === "" ? undefined : Number(value);
    case "select":
    case "color":
      return value === "" ? undefined : Number(value);
    default:
      return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  }
}

/** Build the `attributes` payload from the attributes that apply (axes excluded). */
export function buildAttributePayload(specs: EffectiveAttribute[], values: AttributeFormValues): Record<string, AttributeValue> {
  const payload: Record<string, AttributeValue> = {};
  for (const attribute of specs) {
    const value = toApiValue(attribute, values[attribute.code]);
    if (value !== undefined) payload[attribute.code] = value;
  }
  return payload;
}
