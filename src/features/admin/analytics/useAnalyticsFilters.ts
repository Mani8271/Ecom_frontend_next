"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { AnalyticsQuery, RangeKey } from "@/services/admin/analytics.types";

const STORAGE_KEY = "gk_admin_analytics_filters";
// *_name keys only label the pickers; they are not sent to the API.
const KEYS = ["range", "from", "to", "category_id", "category_name", "brand_id", "brand_name", "payment_method", "status"] as const;
type FilterKey = (typeof KEYS)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7 days",
  "30d": "30 days",
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  last_year: "Last year",
  all: "All time",
  custom: "Custom",
};

function readStored(): Partial<Record<FilterKey, string>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Record<FilterKey, string>>;
  } catch {
    return {};
  }
}

/**
 * Dashboard filters live in the URL (shareable, back button works) and are
 * remembered across admin pages, so "Last 30 days" sticks while navigating.
 */
export function useAnalyticsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const values = useMemo(() => {
    const fromUrl = Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? undefined]).filter(([, v]) => v)) as Partial<Record<FilterKey, string>>;
    return Object.keys(fromUrl).length ? fromUrl : readStored();
  }, [params]);

  const query: AnalyticsQuery = useMemo(
    () => ({
      range: (values.range as RangeKey) ?? "30d",
      from: values.range === "custom" ? values.from : undefined,
      to: values.range === "custom" ? values.to : undefined,
      category_id: values.category_id ? Number(values.category_id) : undefined,
      brand_id: values.brand_id ? Number(values.brand_id) : undefined,
      payment_method: values.payment_method as AnalyticsQuery["payment_method"],
      status: values.status || undefined,
    }),
    [values],
  );

  const set = useCallback(
    (patch: Partial<Record<FilterKey, string | number | undefined | null>>) => {
      const next: Record<string, string> = {};
      for (const key of KEYS) {
        const value = key in patch ? patch[key] : values[key];
        if (value !== undefined && value !== null && value !== "") next[key] = String(value);
      }
      if (next.range !== "custom") {
        delete next.from;
        delete next.to;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable: the URL still carries the filters
      }
      const search = new URLSearchParams(next).toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [values, router, pathname],
  );

  const reset = useCallback(
    () => set({ range: "30d", from: undefined, to: undefined, category_id: undefined, category_name: undefined, brand_id: undefined, brand_name: undefined, payment_method: undefined, status: undefined }),
    [set],
  );

  return { query, values, set, reset };
}
