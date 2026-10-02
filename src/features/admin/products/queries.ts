"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCatalogService as api } from "@/services/admin/catalog.service";
import type { GenerateVariantsInput, ProductCreateInput, ProductFields, ProductListQuery, ProductStatus, VariantBulkRow } from "@/services/admin/types";
import { adminKeys } from "../catalog/queries";

export function useProductList(query: ProductListQuery) {
  return useQuery({ queryKey: adminKeys.productList(query), queryFn: () => api.products(query), placeholderData: keepPreviousData });
}

export function useProduct(id: number) {
  return useQuery({ queryKey: adminKeys.product(id), queryFn: () => api.product(id).then((r) => r.data) });
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: [...adminKeys.products, "list"] });

  return {
    create: useMutation({ mutationFn: (input: ProductCreateInput) => api.createProduct(input), onSuccess: invalidateList }),
    remove: useMutation({ mutationFn: (id: number) => api.deleteProduct(id), onSuccess: invalidateList }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: number; status: ProductStatus }) => api.updateProductStatus(id, status),
      onSuccess: (_, { id }) => {
        void invalidateList();
        void queryClient.invalidateQueries({ queryKey: adminKeys.product(id) });
      },
    }),
  };
}

/** Mutations on one product; each refreshes its detail + the list. */
export function useProductEditor(productId: number) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.product(productId) });
    void queryClient.invalidateQueries({ queryKey: [...adminKeys.products, "list"] });
  };

  return {
    update: useMutation({
      mutationFn: (input: Partial<ProductFields>) => api.updateProduct(productId, input),
      onSuccess: ({ data }) => {
        queryClient.setQueryData(adminKeys.product(productId), data);
        void queryClient.invalidateQueries({ queryKey: [...adminKeys.products, "list"] });
      },
    }),
    bulkVariants: useMutation({ mutationFn: (rows: VariantBulkRow[]) => api.bulkUpdateVariants(productId, rows), onSuccess: refresh }),
    generateVariants: useMutation({ mutationFn: (input: GenerateVariantsInput) => api.generateVariants(productId, input), onSuccess: refresh }),
    deleteVariant: useMutation({ mutationFn: (variantId: number) => api.deleteVariant(productId, variantId), onSuccess: refresh }),
    uploadImage: useMutation({
      mutationFn: ({ file, variantIds }: { file: File; variantIds?: number[] }) => api.uploadProductImage(productId, file, variantIds),
      onSuccess: refresh,
    }),
    reorderImages: useMutation({ mutationFn: (mediaIds: number[]) => api.reorderProductImages(productId, mediaIds), onSuccess: refresh }),
    assignImage: useMutation({
      mutationFn: ({ mediaId, variantIds }: { mediaId: number; variantIds: number[] }) => api.assignProductImage(productId, mediaId, variantIds),
      onSuccess: refresh,
    }),
    deleteImage: useMutation({ mutationFn: (mediaId: number) => api.deleteProductImage(productId, mediaId), onSuccess: refresh }),
  };
}
