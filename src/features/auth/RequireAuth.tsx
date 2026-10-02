"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { routes } from "@/config/routes";
import { useAuth } from "./AuthProvider";

/**
 * Client-side guard for private pages. It only improves UX; the API enforces
 * authentication on every private endpoint.
 */
export function RequireAuth({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") router.replace(routes.login(pathname));
  }, [status, router, pathname]);

  return status === "authenticated" ? children : fallback;
}
