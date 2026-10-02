"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { cartService } from "@/services/cart/cart.service";
import { cartToken } from "@/services/cart/cart-token";
import { useWishlistMerge } from "./wishlist-hooks";

/** After login, merges the guest bag and guest wishlist into the account (once per login). */
export function CartSync() {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const mergedFor = useRef<number | null>(null);
  useWishlistMerge();

  useEffect(() => {
    if (status !== "authenticated" || !user || mergedFor.current === user.id || !cartToken.get()) return;
    mergedFor.current = user.id;

    cartService
      .merge()
      .then((cart) => {
        cartToken.clear();
        queryClient.setQueryData(["cart", user.id], cart);
      })
      .catch(() => {
        mergedFor.current = null; // try again on the next render
      });
  }, [status, user, queryClient]);

  return null;
}
