"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCatalogService as api } from "@/services/admin/catalog.service";
import type {
  AttributeInput,
  BrandInput,
  CategoryAttributeInput,
  CategoryInput,
  CategoryListQuery,
  ProductListQuery,
} from "@/services/admin/types";
import type { PageQuery } from "@/types/api";

export const adminKeys = {
  categories: ["admin", "categories"] as const,
  categoryList: (query: CategoryListQuery) => ["admin", "categories", "list", query] as const,
  categoryAttributes: (id: number) => ["admin", "categories", "attributes", id] as const,
  attributes: ["admin", "attributes"] as const,
  attributeList: (query: PageQuery & { type?: string }) => ["admin", "attributes", "list", query] as const,
  attribute: (id: number) => ["admin", "attributes", "detail", id] as const,
  attributeGroups: ["admin", "attribute-groups"] as const,
  brands: ["admin", "brands"] as const,
  brandList: (query: PageQuery) => ["admin", "brands", "list", query] as const,
  taxClasses: ["admin", "tax-classes"] as const,
  products: ["admin", "products"] as const,
  productList: (query: ProductListQuery) => ["admin", "products", "list", query] as const,
  product: (id: number) => ["admin", "products", "detail", id] as const,
};

// ---------------------------------------------------------------- categories

export function useCategoryList(query: CategoryListQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.categoryList(query),
    queryFn: () => api.categories(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCategoryAttributes(id: number | null | undefined) {
  return useQuery({
    queryKey: adminKeys.categoryAttributes(id ?? 0),
    queryFn: () => api.categoryAttributes(id as number).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.categories });

  return {
    save: useMutation({
      mutationFn: ({ id, input }: { id?: number; input: CategoryInput }) => (id ? api.updateCategory(id, input) : api.createCategory(input)),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => api.deleteCategory(id), onSuccess: invalidate }),
    syncAttributes: useMutation({
      mutationFn: ({ id, attributes }: { id: number; attributes: CategoryAttributeInput[] }) => api.syncCategoryAttributes(id, attributes),
      onSuccess: invalidate,
    }),
  };
}

// ---------------------------------------------------------------- attributes

export function useAttributeList(query: PageQuery & { type?: string }) {
  return useQuery({ queryKey: adminKeys.attributeList(query), queryFn: () => api.attributes(query), placeholderData: keepPreviousData });
}

export function useAttribute(id: number | null | undefined) {
  return useQuery({ queryKey: adminKeys.attribute(id ?? 0), queryFn: () => api.attribute(id as number).then((r) => r.data), enabled: Boolean(id) });
}

export function useAttributeGroups() {
  return useQuery({
    queryKey: adminKeys.attributeGroups,
    queryFn: () => api.attributeGroups({ limit: 100, sort: "position" }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useAttributeMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.attributes });
    // Option changes show up in every category's product form.
    void queryClient.invalidateQueries({ queryKey: adminKeys.categories });
  };

  return {
    save: useMutation({
      mutationFn: ({ id, input }: { id?: number; input: AttributeInput }) => (id ? api.updateAttribute(id, input) : api.createAttribute(input)),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => api.deleteAttribute(id), onSuccess: invalidate }),
  };
}

// ---------------------------------------------------------------- brands

export function useBrandList(query: PageQuery) {
  return useQuery({ queryKey: adminKeys.brandList(query), queryFn: () => api.brands(query), placeholderData: keepPreviousData });
}

export function useBrandMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.brands });

  return {
    save: useMutation({
      mutationFn: ({ id, input }: { id?: number; input: BrandInput }) => (id ? api.updateBrand(id, input) : api.createBrand(input)),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => api.deleteBrand(id), onSuccess: invalidate }),
  };
}

// ---------------------------------------------------------------- tax classes

export function useTaxClasses() {
  return useQuery({
    queryKey: adminKeys.taxClasses,
    queryFn: () => api.taxClasses({ limit: 100, sort: "name" }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
