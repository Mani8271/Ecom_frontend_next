"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { safeRedirectPath } from "@/config/routes";
import { useAuth } from "./AuthProvider";

/** Login/register screens: signed-in users are sent on to where they were going. */
export function GuestOnly({ children, next }: { children: ReactNode; next?: string }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace(safeRedirectPath(next));
  }, [status, router, next]);

  return children;
}
