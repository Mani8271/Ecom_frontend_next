"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { http } from "@/services/api/http";
import type { ProductCard as ProductCardData } from "@/services/catalog/types";
import { ProductGrid } from "./ProductCard";

const KEY = "gk_recently_viewed";
const MAX = 20;

function readIds(): number[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Remembers this product as recently viewed (browser only, no tracking on the server). */
export function TrackRecentlyViewed({ productId }: { productId: number }) {
  useEffect(() => {
    try {
      const ids = [productId, ...readIds().filter((id) => id !== productId)].slice(0, MAX);
      window.localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // storage unavailable
    }
  }, [productId]);

  return null;
}

/** Cards for the products this shopper viewed recently (excluding the current one). */
export function RecentlyViewedSection({ excludeId, title = "Recently viewed" }: { excludeId?: number; title?: string }) {
  // localStorage only exists in the browser; the server renders nothing here.
  const raw = useSyncExternalStore(subscribe, () => window.localStorage.getItem(KEY) ?? "[]", () => "[]");
  const ids = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id) && id !== excludeId).slice(0, 8) : [];
    } catch {
      return [];
    }
  }, [raw, excludeId]);

  const { data = [] } = useQuery({
    queryKey: ["recently-viewed", ids],
    queryFn: () => http.get<ProductCardData[]>("/products/batch", { query: { ids }, auth: false }).then((r) => r.data),
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
  });

  if (data.length === 0) return null;

  return (
    <Box component="section" sx={{ mt: { xs: 6, md: 10 } }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2.5 }}>
        {title}
      </Typography>
      <ProductGrid products={data.slice(0, 8)} />
    </Box>
  );
}
