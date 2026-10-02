"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/services/account/account.service";
import type { AddressInput } from "@/services/account/types";

export const accountKeys = {
  addresses: (page: number) => ["account", "addresses", { page }] as const,
  addressesAll: ["account", "addresses"] as const,
};

export const ADDRESS_PAGE_SIZE = 10;

export function useAddresses(page: number) {
  return useQuery({
    queryKey: accountKeys.addresses(page),
    queryFn: () => accountService.addresses({ page, limit: ADDRESS_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

export function useAddressMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: accountKeys.addressesAll });

  return {
    save: useMutation({
      mutationFn: ({ id, input }: { id?: number; input: AddressInput }) =>
        id ? accountService.updateAddress(id, input) : accountService.createAddress(input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => accountService.deleteAddress(id), onSuccess: invalidate }),
    makeDefault: useMutation({ mutationFn: (id: number) => accountService.setDefaultAddress(id), onSuccess: invalidate }),
  };
}
