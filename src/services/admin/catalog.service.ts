import { http } from "@/services/api/http";
import type { PageQuery } from "@/types/api";
import type {
  AdminAttribute,
  AdminBrand,
  AdminCategory,
  AdminProduct,
  AdminProductRow,
  AdminVariant,
  AttributeGroup,
  AttributeInput,
  BrandInput,
  CategoryAttributeInput,
  CategoryAttributes,
  CategoryInput,
  CategoryListQuery,
  GenerateVariantsInput,
  Media,
  ProductCreateInput,
  ProductFields,
  ProductListQuery,
  ProductStatus,
  TaxClass,
  VariantBulkRow,
  VariantInput,
} from "./types";

function upload(path: string, file: File, extra: Record<string, string | number[]> = {}) {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(extra)) {
    if (Array.isArray(value)) value.forEach((v) => form.append(`${key}[]`, String(v)));
    else form.append(key, value);
  }
  return http.post<Media>(path, form);
}

/** Admin catalog endpoints (/api/v1/admin/*). Every call is permission-checked by the API. */
export const adminCatalogService = {
  // Categories
  categories: (query: CategoryListQuery = {}) => http.paginated<AdminCategory>("/admin/categories", { query: { ...query } }),
  category: (id: number) => http.get<AdminCategory & { breadcrumbs: { id: number; name: string }[] }>(`/admin/categories/${id}`),
  createCategory: (input: CategoryInput) => http.post<AdminCategory>("/admin/categories", input),
  updateCategory: (id: number, input: Partial<CategoryInput>) => http.patch<AdminCategory>(`/admin/categories/${id}`, input),
  deleteCategory: (id: number) => http.delete(`/admin/categories/${id}`),
  categoryAttributes: (id: number) => http.get<CategoryAttributes>(`/admin/categories/${id}/attributes`),
  syncCategoryAttributes: (id: number, attributes: CategoryAttributeInput[]) =>
    http.put<CategoryAttributes>(`/admin/categories/${id}/attributes`, { attributes }),

  // Attributes
  attributes: (query: PageQuery & { type?: string } = {}) => http.paginated<AdminAttribute>("/admin/attributes", { query: { ...query } }),
  attribute: (id: number) => http.get<AdminAttribute>(`/admin/attributes/${id}`),
  createAttribute: (input: AttributeInput) => http.post<AdminAttribute>("/admin/attributes", input),
  updateAttribute: (id: number, input: Partial<AttributeInput>) => http.patch<AdminAttribute>(`/admin/attributes/${id}`, input),
  deleteAttribute: (id: number) => http.delete(`/admin/attributes/${id}`),
  attributeGroups: (query: PageQuery = {}) => http.paginated<AttributeGroup>("/admin/attribute-groups", { query: { ...query } }),

  // Brands
  brands: (query: PageQuery & { is_active?: 0 | 1 } = {}) => http.paginated<AdminBrand>("/admin/brands", { query: { ...query } }),
  createBrand: (input: BrandInput) => http.post<AdminBrand>("/admin/brands", input),
  updateBrand: (id: number, input: Partial<BrandInput>) => http.patch<AdminBrand>(`/admin/brands/${id}`, input),
  deleteBrand: (id: number) => http.delete(`/admin/brands/${id}`),

  // Tax classes
  taxClasses: (query: PageQuery = {}) => http.paginated<TaxClass>("/admin/tax-classes", { query: { ...query } }),

  // Products
  products: (query: ProductListQuery = {}) => http.paginated<AdminProductRow>("/admin/products", { query: { ...query } }),
  product: (id: number) => http.get<AdminProduct>(`/admin/products/${id}`),
  createProduct: (input: ProductCreateInput) => http.post<AdminProduct>("/admin/products", input),
  updateProduct: (id: number, input: Partial<ProductFields>) => http.patch<AdminProduct>(`/admin/products/${id}`, input),
  updateProductStatus: (id: number, status: ProductStatus) => http.patch<AdminProductRow>(`/admin/products/${id}/status`, { status }),
  deleteProduct: (id: number) => http.delete(`/admin/products/${id}`),

  // Variants
  addVariant: (productId: number, input: VariantInput) => http.post<AdminVariant>(`/admin/products/${productId}/variants`, input),
  generateVariants: (productId: number, input: GenerateVariantsInput) =>
    http.post<AdminVariant[]>(`/admin/products/${productId}/variants/generate`, input),
  bulkUpdateVariants: (productId: number, variants: VariantBulkRow[]) =>
    http.patch<AdminVariant[]>(`/admin/products/${productId}/variants/bulk`, { variants }),
  deleteVariant: (productId: number, variantId: number) => http.delete(`/admin/products/${productId}/variants/${variantId}`),

  // Product images
  uploadProductImage: (productId: number, file: File, variantIds: number[] = []) =>
    upload(`/admin/products/${productId}/media`, file, variantIds.length ? { variant_ids: variantIds } : {}),
  reorderProductImages: (productId: number, mediaIds: number[]) =>
    http.patch<Media[]>(`/admin/products/${productId}/media/reorder`, { media_ids: mediaIds }),
  assignProductImage: (productId: number, mediaId: number, variantIds: number[]) =>
    http.put(`/admin/products/${productId}/media/${mediaId}/variants`, { variant_ids: variantIds }),
  deleteProductImage: (productId: number, mediaId: number) => http.delete(`/admin/products/${productId}/media/${mediaId}`),

  // Generic uploads (category images, brand logos)
  uploadImage: (file: File, alt?: string) => upload("/admin/media", file, alt ? { alt } : {}),
};
