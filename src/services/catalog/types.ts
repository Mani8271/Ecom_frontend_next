/** Mirrors backend app/Http/Resources/V1/Catalog/* and FacetService. */

export interface CardImage {
  alt: string | null;
  thumb: string | null;
  sm: string | null;
  md: string | null;
  lg: string | null;
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  brand: { name: string; slug: string } | null;
  price: string | null;
  price_varies: boolean;
  compare_at_price: string | null;
  discount_pct: number;
  in_stock: boolean;
  rating: { average: number; count: number };
  badges: ("new" | "bestseller" | "featured")[];
  image: CardImage | null;
}

export interface OptionFacet {
  type: "options";
  code: string;
  name: string;
  display_type: string;
  options: { value: string; label: string; swatch?: string | null; count: number; selected: boolean }[];
}

export interface RangeFacet {
  type: "range" | "price";
  code: string;
  name: string;
  unit?: string | null;
  min: number;
  max: number;
  selected: [number | null, number | null] | null;
}

export type Facet = OptionFacet | RangeFacet;

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  depth: number;
  description?: string | null;
  image?: CardImage | null;
  banner?: CardImage | null;
  seo: { title: string; description: string | null; keywords?: string | null };
  children?: Category[];
}

export interface CategoryDetail extends Category {
  breadcrumbs: { name: string; slug: string }[];
}

export interface ProductMedia {
  id: number;
  type: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  urls: Record<string, string | null>;
}

export interface ProductAxis {
  code: string;
  name: string;
  display_type: string;
  options: { id: number; label: string; slug: string; swatch: string | null; in_stock: boolean }[];
}

export interface ProductVariant {
  id: number;
  sku: string;
  title: string | null;
  /** axis code => option id */
  options: Record<string, number>;
  price: string;
  compare_at_price: string | null;
  in_stock: boolean;
  stock_left: number | null;
  media_ids: number[];
}

export interface ProductDetail extends ProductCard {
  style_code: string | null;
  type: "simple" | "variable";
  short_description: string | null;
  description: string | null;
  features: string[];
  breadcrumbs: { name: string; slug: string }[];
  category: { name: string; slug: string };
  tags: { name: string; slug: string }[];
  media: ProductMedia[];
  axes: ProductAxis[];
  variants: ProductVariant[];
  specifications: { group: string; items: { name: string; value: string }[] }[];
  size_guide: { name: string; unit: string; content: unknown; notes: string | null } | null;
  seo: { title: string; description: string | null; keywords: string | null };
}

export const PRODUCT_SORTS = [
  { value: "popular", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Discount" },
  { value: "rating", label: "Customer rating" },
] as const;
