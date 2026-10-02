/** Mirrors backend app/Http/Resources/V1/Admin/* and the admin request rules. */

import type { PageQuery } from "@/types/api";

export interface ImageSet {
  id?: number;
  alt: string | null;
  thumb: string | null;
  sm: string | null;
  md: string | null;
  lg: string | null;
}

export interface Media {
  id: number;
  type: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  urls: Record<string, string | null>;
  collection?: string;
}

// ---------------------------------------------------------------- categories

export interface AdminCategory {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  depth: number;
  path: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  sort_order: number;
  is_active: boolean;
  children_count?: number;
  products_count?: number;
  parent?: { id: number; name: string } | null;
  image?: ImageSet | null;
  banner?: ImageSet | null;
  updated_at: string | null;
}

export interface CategoryInput {
  name: string;
  slug?: string | null;
  parent_id?: number | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  sort_order?: number;
  is_active?: boolean;
  image_id?: number | null;
}

export interface CategoryListQuery extends PageQuery {
  parent_id?: number | null;
  is_active?: 0 | 1;
}

// ---------------------------------------------------------------- attributes

export const ATTRIBUTE_TYPES = ["text", "number", "boolean", "select", "multiselect", "color", "date", "range"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const DISPLAY_TYPES = ["default", "swatch", "button", "dropdown", "checkbox"] as const;
export type DisplayType = (typeof DISPLAY_TYPES)[number];

/** Types whose values come from a fixed option list. */
export const OPTION_TYPES: readonly AttributeType[] = ["select", "multiselect", "color"];
/** Types that can split a product into variants. */
export const AXIS_TYPES: readonly AttributeType[] = ["select", "color"];

export interface AttributeOption {
  id: number;
  label: string;
  slug: string;
  swatch_value: string | null;
  sort_order: number;
}

export interface AttributeValidation {
  min?: number | null;
  max?: number | null;
  max_length?: number | null;
  regex?: string | null;
}

export interface AdminAttribute {
  id: number;
  code: string;
  name: string;
  type: AttributeType;
  unit: string | null;
  display_type: DisplayType;
  attribute_group_id: number | null;
  group?: string | null;
  is_filterable: boolean;
  is_searchable: boolean;
  is_comparable: boolean;
  can_be_variant_axis: boolean;
  validation: AttributeValidation | null;
  sort_order: number;
  options_count?: number;
  options?: AttributeOption[];
}

export interface AttributeOptionInput {
  id?: number;
  label: string;
  swatch_value?: string | null;
  sort_order?: number;
}

export interface AttributeInput {
  name: string;
  code?: string;
  type: AttributeType;
  unit?: string | null;
  display_type?: DisplayType;
  attribute_group_id?: number | null;
  is_filterable?: boolean;
  is_searchable?: boolean;
  is_comparable?: boolean;
  can_be_variant_axis?: boolean;
  validation?: AttributeValidation | null;
  sort_order?: number;
  options?: AttributeOptionInput[];
}

export interface AttributeGroup {
  id: number;
  name: string;
  sort_order: number;
}

/** An attribute as it applies to a category after inheritance (drives the product form). */
export interface EffectiveAttribute {
  id: number;
  code: string;
  name: string;
  type: AttributeType;
  unit: string | null;
  display_type: DisplayType;
  group: string | null;
  validation: AttributeValidation | null;
  is_required: boolean;
  is_filterable: boolean;
  is_variant_axis: boolean;
  can_be_variant_axis: boolean;
  sort_order: number;
  inherited_from: number;
  options: { id: number; label: string; slug: string; swatch: string | null }[];
}

export interface CategoryAttributeAssignment {
  attribute_id: number;
  code: string;
  name: string;
  is_required: boolean;
  is_filterable: boolean | null;
  is_variant_axis: boolean;
  sort_order: number;
}

export interface CategoryAttributes {
  effective: EffectiveAttribute[];
  assigned: CategoryAttributeAssignment[];
}

export type CategoryAttributeInput = Omit<CategoryAttributeAssignment, "code" | "name">;

// ---------------------------------------------------------------- brands

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
  logo?: ImageSet | null;
}

export interface BrandInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  logo_id?: number | null;
}

// ---------------------------------------------------------------- tax

export interface TaxClass {
  id: number;
  name: string;
  hsn_code: string | null;
  is_default: boolean;
}

// ---------------------------------------------------------------- products

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_VISIBILITIES = ["everywhere", "catalog", "search", "hidden"] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITIES)[number];

export type VariantStatus = "active" | "inactive";

export interface AdminVariant {
  id: number;
  sku: string;
  barcode: string | null;
  title: string | null;
  is_default: boolean;
  options: { attribute_id: number; option_id: number; label: string }[];
  price: string;
  compare_at_price: string | null;
  sale_price: string | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  current_price: string;
  cost_price: string | null;
  weight_grams: number | null;
  status: VariantStatus;
  position: number;
  stock: { on_hand: number; reserved: number; available: number };
  media_ids: number[];
}

export interface AdminProductRow {
  id: number;
  name: string;
  slug: string;
  style_code: string | null;
  type: "simple" | "variable";
  status: ProductStatus;
  visibility: ProductVisibility;
  brand: { id: number; name: string } | null;
  primary_category: { id: number; name: string };
  min_price: string | null;
  max_price: string | null;
  in_stock: boolean;
  total_stock?: number;
  variants_count?: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  thumbnail: Omit<ImageSet, "id"> | null;
  published_at: string | null;
  updated_at: string | null;
}

/** Spec value per attribute code, in the shape the API accepts. */
export type AttributeValue = string | number | boolean | number[] | { min: number; max: number } | null;

export interface AdminProduct extends AdminProductRow {
  brand_id: number | null;
  primary_category_id: number;
  category_ids: number[];
  tax_class_id: number | null;
  hsn_code: string | null;
  size_guide_id: number | null;
  short_description: string | null;
  description: string | null;
  features: string[];
  low_stock_threshold: number | null;
  weight_grams: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  tags: string[];
  attributes: Record<string, AttributeValue>;
  variant_axes: { id: number; code: string; name: string }[];
  variants: AdminVariant[];
  media: Media[];
}

export interface ProductFields {
  name: string;
  slug?: string | null;
  style_code?: string | null;
  brand_id?: number | null;
  primary_category_id: number;
  category_ids?: number[];
  tax_class_id?: number | null;
  hsn_code?: string | null;
  short_description?: string | null;
  description?: string | null;
  features?: string[];
  status?: ProductStatus;
  visibility?: ProductVisibility;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_bestseller?: boolean;
  low_stock_threshold?: number | null;
  weight_grams?: number | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  tags?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  attributes?: Record<string, AttributeValue>;
}

export interface VariantInput {
  sku?: string | null;
  barcode?: string | null;
  price: number;
  compare_at_price?: number | null;
  sale_price?: number | null;
  cost_price?: number | null;
  weight_grams?: number | null;
  status?: VariantStatus;
  stock?: number;
  /** axis code => option id */
  options?: Record<string, number>;
}

export interface ProductCreateInput extends ProductFields {
  variant_axes?: string[];
  variants: VariantInput[];
}

export interface VariantBulkRow {
  id: number;
  sku?: string;
  price?: number;
  compare_at_price?: number | null;
  sale_price?: number | null;
  status?: VariantStatus;
  stock?: number;
}

export interface GenerateVariantsInput {
  /** axis code => option ids, in axis order */
  axes: Record<string, number[]>;
  price: number;
  compare_at_price?: number | null;
  stock?: number;
}

export interface ProductListQuery extends PageQuery {
  status?: ProductStatus;
  category_id?: number;
  brand_id?: number;
  stock?: "in_stock" | "out_of_stock";
}
