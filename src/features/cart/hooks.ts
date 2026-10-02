"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/components/feedback/notify";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { cartService } from "@/services/cart/cart.service";
import type { Cart } from "@/services/cart/types";

/** One cache entry per viewer (guest or customer id) so logins never show a stale bag. */
export function useCartKey() {
  const { status, user } = useAuth();
  return ["cart", status === "authenticated" ? user?.id : "guest"] as const;
}

export function useCart() {
  const { status } = useAuth();
  const key = useCartKey();

  return useQuery({
    queryKey: key,
    queryFn: cartService.get,
    enabled: status !== "loading",
    staleTime: 15_000,
  });
}

/** Header badge: total quantity in the bag. */
export function useCartCount(): number {
  return useCart().data?.item_count ?? 0;
}

/** Cart mutations; every response is the full server-priced cart. */
export function useCartActions() {
  const queryClient = useQueryClient();
  const key = useCartKey();
  const notify = useNotify();
  const put = (cart: Cart) => queryClient.setQueryData(key, cart);
  const onError = (error: unknown) => notify.error(error);

  return {
    add: useMutation({
      mutationFn: ({ variantId, quantity }: { variantId: number; quantity: number; silent?: boolean }) => cartService.add(variantId, quantity),
      onSuccess: ({ cart }, { silent }) => {
        put(cart);
        if (!silent) notify.success("Added to your bag", { label: "View bag", href: routes.cart });
      },
      onError,
    }),
    update: useMutation({ mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => cartService.update(itemId, quantity), onSuccess: put, onError }),
    remove: useMutation({ mutationFn: (itemId: number) => cartService.remove(itemId), onSuccess: put, onError }),
    clear: useMutation({ mutationFn: cartService.clear, onSuccess: put, onError }),
    applyCoupon: useMutation({ mutationFn: (code: string) => cartService.applyCoupon(code), onSuccess: put }),
    removeCoupon: useMutation({ mutationFn: cartService.removeCoupon, onSuccess: put, onError }),
    moveToWishlist: useMutation({
      mutationFn: (itemId: number) => cartService.moveToWishlist(itemId),
      onSuccess: (cart) => {
        put(cart);
        void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        notify.success("Moved to your wishlist");
      },
      onError,
    }),
  };
}
