import { z } from "zod";
import { orNull } from "@/lib/forms";
import { intString, optionalSlugSchema } from "@/lib/validation";
import { PRODUCT_STATUSES, PRODUCT_VISIBILITIES, type AdminProduct, type EffectiveAttribute, type ProductFields } from "@/services/admin/types";
import type { PickerOption } from "../components/EntityPicker";
import { buildAttributePayload, toFormValue, type AttributeFormValue, type AttributeFormValues } from "./attribute-values";

const optionalInt = intString();

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter the product name").max(255),
  slug: optionalSlugSchema,
  style_code: z.string().trim().max(64),
  category: z.custom<PickerOption | null>().refine((value) => Boolean(value), "Choose a category"),
  brand: z.custom<PickerOption | null>(),
  tax_class_id: z.string(),
  hsn_code: z.string().trim().regex(/^(\d{4,8})?$/, "HSN code must be 4 to 8 digits"),
  status: z.enum(PRODUCT_STATUSES),
  visibility: z.enum(PRODUCT_VISIBILITIES),
  is_featured: z.boolean(),
  is_new_arrival: z.boolean(),
  is_bestseller: z.boolean(),
  short_description: z.string().max(500),
  description: z.string().max(100000),
  features: z.string().max(4000),
  tags: z.array(z.string().trim().min(1).max(100)).max(30, "Use at most 30 tags"),
  low_stock_threshold: optionalInt,
  weight_grams: optionalInt,
  length_mm: optionalInt,
  width_mm: optionalInt,
  height_mm: optionalInt,
  meta_title: z.string().max(255),
  meta_description: z.string().max(500),
  meta_keywords: z.string().max(500),
  attributes: z.record(z.string(), z.custom<AttributeFormValue>()),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Fields a 422 response can point at directly. */
export const PRODUCT_FIELDS = [
  "name",
  "slug",
  "style_code",
  "tax_class_id",
  "hsn_code",
  "status",
  "visibility",
  "short_description",
  "description",
  "low_stock_threshold",
  "weight_grams",
  "length_mm",
  "width_mm",
  "height_mm",
  "meta_title",
  "meta_description",
  "meta_keywords",
] as const;

export function emptyProductValues(defaultTaxClassId?: number): ProductFormValues {
  return {
    name: "",
    slug: "",
    style_code: "",
    category: null,
    brand: null,
    tax_class_id: defaultTaxClassId ? String(defaultTaxClassId) : "",
    hsn_code: "",
    status: "draft",
    visibility: "everywhere",
    is_featured: false,
    is_new_arrival: true,
    is_bestseller: false,
    short_description: "",
    description: "",
    features: "",
    tags: [],
    low_stock_threshold: "",
    weight_grams: "",
    length_mm: "",
    width_mm: "",
    height_mm: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    attributes: {},
  };
}

const str = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

export function productToValues(product: AdminProduct, effective: EffectiveAttribute[]): ProductFormValues {
  const attributes: AttributeFormValues = {};
  for (const attribute of effective) {
    attributes[attribute.code] = toFormValue(attribute, product.attributes[attribute.code]);
  }

  return {
    name: product.name,
    slug: product.slug,
    style_code: product.style_code ?? "",
    category: { id: product.primary_category.id, label: product.primary_category.name },
    brand: product.brand ? { id: product.brand.id, label: product.brand.name } : null,
    tax_class_id: str(product.tax_class_id),
    hsn_code: product.hsn_code ?? "",
    status: product.status,
    visibility: product.visibility,
    is_featured: product.is_featured,
    is_new_arrival: product.is_new_arrival,
    is_bestseller: product.is_bestseller,
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    features: (product.features ?? []).join("\n"),
    tags: product.tags,
    low_stock_threshold: str(product.low_stock_threshold),
    weight_grams: str(product.weight_grams),
    length_mm: str(product.length_mm),
    width_mm: str(product.width_mm),
    height_mm: str(product.height_mm),
    meta_title: product.meta_title ?? "",
    meta_description: product.meta_description ?? "",
    meta_keywords: product.meta_keywords ?? "",
    attributes,
  };
}

const intOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

/** Form values -> API fields. `specs` = the category's attributes minus the product's variant axes. */
export function valuesToFields(values: ProductFormValues, specs: EffectiveAttribute[]): ProductFields {
  return {
    name: values.name,
    slug: orNull(values.slug),
    style_code: orNull(values.style_code),
    primary_category_id: values.category?.id ?? 0,
    brand_id: values.brand?.id ?? null,
    tax_class_id: values.tax_class_id ? Number(values.tax_class_id) : null,
    hsn_code: orNull(values.hsn_code),
    status: values.status,
    visibility: values.visibility,
    is_featured: values.is_featured,
    is_new_arrival: values.is_new_arrival,
    is_bestseller: values.is_bestseller,
    short_description: orNull(values.short_description),
    description: orNull(values.description),
    features: values.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 20),
    tags: values.tags,
    low_stock_threshold: intOrNull(values.low_stock_threshold),
    weight_grams: intOrNull(values.weight_grams),
    length_mm: intOrNull(values.length_mm),
    width_mm: intOrNull(values.width_mm),
    height_mm: intOrNull(values.height_mm),
    meta_title: orNull(values.meta_title),
    meta_description: orNull(values.meta_description),
    meta_keywords: orNull(values.meta_keywords),
    attributes: buildAttributePayload(specs, values.attributes),
  };
}
