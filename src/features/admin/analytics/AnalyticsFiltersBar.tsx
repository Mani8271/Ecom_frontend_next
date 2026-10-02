"use client";

import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { AppliedFilters, RangeKey } from "@/services/admin/analytics.types";
import { EntityPicker, pickerSearch } from "../components/EntityPicker";
import { RANGE_LABELS, useAnalyticsFilters } from "./useAnalyticsFilters";

const QUICK: RangeKey[] = ["today", "7d", "30d", "this_month", "this_year"];
const MORE: RangeKey[] = ["yesterday", "last_month", "last_year", "all", "custom"];

export const ORDER_STATUS_OPTIONS = [
  ["placed", "Placed"],
  ["confirmed", "Confirmed"],
  ["processing", "Processing"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["return_requested", "Return requested"],
  ["returned", "Returned"],
  ["refunded", "Refunded"],
] as const;

interface AnalyticsFiltersBarProps {
  applied?: AppliedFilters;
  onRefresh: () => void;
  refreshing?: boolean;
  /** Hide filters that don't apply to a page (e.g. status on the inventory page). */
  show?: { category?: boolean; brand?: boolean; payment?: boolean; status?: boolean };
}

/** Global dashboard filters. Every change refetches all widgets from the server. */
export function AnalyticsFiltersBar({ applied, onRefresh, refreshing, show = { category: true, brand: true, payment: true, status: true } }: AnalyticsFiltersBarProps) {
  const { query, values, set, reset } = useAnalyticsFilters();
  const range = query.range ?? "30d";
  const [from, setFrom] = useState(values.from ?? "");
  const [to, setTo] = useState(values.to ?? "");
  const filtered = Boolean(query.category_id || query.brand_id || query.payment_method || query.status);

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, mb: 3, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 4 }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ alignItems: { lg: "center" } }}>
        <Box sx={{ overflowX: "auto" }}>
          <ToggleButtonGroup size="small" exclusive color="primary" value={QUICK.includes(range) ? range : null} onChange={(_, v: RangeKey | null) => v && set({ range: v })} aria-label="Date range">
            {QUICK.map((r) => (
              <ToggleButton key={r} value={r} sx={{ whiteSpace: "nowrap", px: 1.5 }}>
                {RANGE_LABELS[r]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <TextField select size="small" label="More ranges" value={MORE.includes(range) ? range : ""} onChange={(e) => set({ range: e.target.value })} sx={{ minWidth: 150 }}>
          {MORE.map((r) => (
            <MenuItem key={r} value={r}>
              {RANGE_LABELS[r]}
            </MenuItem>
          ))}
        </TextField>
        {range === "custom" && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField size="small" type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }} />
            <TextField size="small" type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }} />
            <Button size="small" variant="outlined" disabled={!from || !to || from > to} onClick={() => set({ range: "custom", from, to })}>
              Apply
            </Button>
          </Stack>
        )}
        <Box sx={{ flex: 1 }} />
        {applied && (
          <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
            {applied.from === applied.to ? applied.from : `${applied.from} → ${applied.to}`} · IST
          </Typography>
        )}
        <Tooltip title="Refresh (bypass the 1-minute cache)">
          <IconButton onClick={onRefresh} aria-label="Refresh" disabled={refreshing}>
            <RefreshIcon sx={refreshing ? { animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } } : undefined} />
          </IconButton>
        </Tooltip>
      </Stack>

      {(show.category || show.brand || show.payment || show.status) && (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 1.5 }}>
          {show.category && (
            <Box sx={{ minWidth: 200 }}>
              <EntityPicker
                size="small"
                label="Category"
                entity="categories"
                search={pickerSearch.categories}
                value={query.category_id ? { id: query.category_id, label: values.category_name ?? `#${query.category_id}` } : null}
                onChange={(v) => set({ category_id: v?.id, category_name: v?.label })}
              />
            </Box>
          )}
          {show.brand && (
            <Box sx={{ minWidth: 180 }}>
              <EntityPicker
                size="small"
                label="Brand"
                entity="brands"
                search={pickerSearch.brands}
                value={query.brand_id ? { id: query.brand_id, label: values.brand_name ?? `#${query.brand_id}` } : null}
                onChange={(v) => set({ brand_id: v?.id, brand_name: v?.label })}
              />
            </Box>
          )}
          {show.payment && (
            <TextField select size="small" label="Payment" value={query.payment_method ?? ""} onChange={(e) => set({ payment_method: e.target.value })} sx={{ minWidth: 150 }}>
              <MenuItem value="">All payments</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="cod">Cash on Delivery</MenuItem>
            </TextField>
          )}
          {show.status && (
            <TextField select size="small" label="Order status" value={query.status ?? ""} onChange={(e) => set({ status: e.target.value })} sx={{ minWidth: 170 }}>
              <MenuItem value="">All sales</MenuItem>
              {ORDER_STATUS_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          )}
          {filtered && (
            <Button size="small" startIcon={<FilterAltOffOutlinedIcon />} onClick={reset} sx={{ alignSelf: "center" }}>
              Clear filters
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
