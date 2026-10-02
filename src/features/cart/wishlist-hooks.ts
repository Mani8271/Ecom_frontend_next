"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNotify } from "@/components/feedback/notify";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { guestWishlist, wishlistService } from "@/services/cart/wishlist.service";

const idsKey = (userId: number | "guest") => ["wishlist", "ids", userId] as const;

/** Saved product ids (server for customers, browser for guests). */
export function useWishlistIds() {
  const { status, user } = useAuth();
  const authed = status === "authenticated" && user;

  return useQuery({
    queryKey: idsKey(authed ? user.id : "guest"),
    queryFn: () => (authed ? wishlistService.ids() : Promise.resolve(guestWishlist.get())),
    enabled: status !== "loading",
    staleTime: 60_000,
  });
}

export function useWishlistCount(): number {
  return useWishlistIds().data?.length ?? 0;
}

export function useWishlistToggle() {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const authed = status === "authenticated" && user;
  const key = idsKey(authed ? user.id : "guest");

  return useMutation({
    mutationFn: async ({ productId, variantId, saved }: { productId: number; variantId?: number | null; saved: boolean }) => {
      if (!authed) {
        const current = guestWishlist.get();
        const next = saved ? current.filter((id) => id !== productId) : [productId, ...current.filter((id) => id !== productId)];
        guestWishlist.set(next);
        return next;
      }
      return saved ? wishlistService.remove(productId) : wishlistService.add(productId, variantId);
    },
    onMutate: async ({ productId, saved }) => {
      // Optimistic heart.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<number[]>(key) ?? [];
      queryClient.setQueryData(key, saved ? previous.filter((id) => id !== productId) : [productId, ...previous]);
      return { previous };
    },
    onSuccess: (ids, { saved }) => {
      queryClient.setQueryData(key, ids);
      void queryClient.invalidateQueries({ queryKey: ["wishlist", "list"] });
      notify.success(saved ? "Removed from your wishlist" : "Saved to your wishlist", saved ? undefined : { label: "View", href: routes.wishlist });
    },
    onError: (error, _vars, context) => {
      if (context) queryClient.setQueryData(key, context.previous);
      notify.error(error);
    },
  });
}

/** After login, move the browser wishlist into the account. */
export function useWishlistMerge() {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const done = useRef<number | null>(null);

  useEffect(() => {
    const ids = guestWishlist.get();
    if (status !== "authenticated" || !user || done.current === user.id || ids.length === 0) return;
    done.current = user.id;
    wishlistService
      .merge(ids)
      .then((merged) => {
        guestWishlist.clear();
        queryClient.setQueryData(idsKey(user.id), merged);
      })
      .catch(() => {
        done.current = null;
      });
  }, [status, user, queryClient]);
}
