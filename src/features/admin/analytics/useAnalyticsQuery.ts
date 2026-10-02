"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AnalyticsQuery } from "@/services/admin/analytics.types";

/**
 * One analytics widget. `nonce` > 0 means "Refresh was clicked": the request
 * then skips the server's one-minute cache.
 */
export function useAnalyticsQuery<T>(name: string, fetcher: (q: AnalyticsQuery) => Promise<T>, query: AnalyticsQuery, nonce: number, options: { enabled?: boolean; refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: ["admin", "analytics", name, query, nonce],
    queryFn: () => fetcher(nonce > 0 ? { ...query, fresh: 1 } : query),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
  });
}
