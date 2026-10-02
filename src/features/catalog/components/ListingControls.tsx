"use client";

import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { PRODUCT_SORTS, type Facet, type OptionFacet, type RangeFacet } from "@/services/catalog/types";
import type { SearchParams } from "../listing-params";

const COLLAPSED_OPTIONS = 8;

function toUrlParams(params: SearchParams): URLSearchParams {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) url.set(key, v);
  }
  return url;
}

/** Updates the listing URL; the server re-renders with the new results. */
function useListingUrl(params: SearchParams) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const go = (mutate: (url: URLSearchParams) => void, keepPage = false) => {
    const url = toUrlParams(params);
    mutate(url);
    if (!keepPage) url.delete("page");
    const query = url.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: keepPage }));
  };

  return { go, pending, url: toUrlParams(params) };
}

function paramKey(facet: Facet): string {
  return facet.code; // "brand" or an attribute code
}

function OptionFacetView({ facet, params }: { facet: OptionFacet; params: SearchParams }) {
  const { go, url } = useListingUrl(params);
  const [expanded, setExpanded] = useState(false);
  const key = paramKey(facet);
  const selected = (url.get(key) ?? "").split(",").filter(Boolean);
  const options = expanded ? facet.options : facet.options.slice(0, COLLAPSED_OPTIONS);

  const toggle = (value: string) =>
    go((u) => {
      const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
      if (next.length) u.set(key, next.join(","));
      else u.delete(key);
    });

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {facet.name}
      </Typography>
      <Stack>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            disabled={option.count === 0 && !option.selected}
            control={<Checkbox size="small" checked={option.selected} onChange={() => toggle(option.value)} />}
            label={
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {option.swatch && <Box component="span" sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: option.swatch, border: 1, borderColor: "divider" }} />}
                <Typography variant="body2">{option.label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  ({option.count})
                </Typography>
              </Stack>
            }
          />
        ))}
      </Stack>
      {facet.options.length > COLLAPSED_OPTIONS && (
        <Button size="small" onClick={() => setExpanded((v) => !v)} sx={{ mt: 0.5, px: 0, minHeight: 0 }}>
          {expanded ? "Show less" : `+ ${facet.options.length - COLLAPSED_OPTIONS} more`}
        </Button>
      )}
    </Box>
  );
}

function RangeFacetView({ facet, params }: { facet: RangeFacet; params: SearchParams }) {
  const { go, url } = useListingUrl(params);
  const minKey = facet.type === "price" ? "price_min" : `${facet.code}_min`;
  const maxKey = facet.type === "price" ? "price_max" : `${facet.code}_max`;
  const [min, setMin] = useState(url.get(minKey) ?? "");
  const [max, setMax] = useState(url.get(maxKey) ?? "");
  const unit = facet.type === "price" ? "₹" : facet.unit ?? "";

  function apply(event: FormEvent) {
    event.preventDefault();
    go((u) => {
      for (const [k, v] of [[minKey, min], [maxKey, max]] as const) {
        if (v.trim() && Number.isFinite(Number(v))) u.set(k, v.trim());
        else u.delete(k);
      }
    });
  }

  return (
    <Box component="form" onSubmit={apply}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {facet.name}
        {facet.unit ? ` (${facet.unit})` : ""}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField size="small" placeholder={`${unit}${Math.floor(facet.min)}`} value={min} onChange={(e) => setMin(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": `Minimum ${facet.name}` } }} />
        <Typography variant="body2">–</Typography>
        <TextField size="small" placeholder={`${unit}${Math.ceil(facet.max)}`} value={max} onChange={(e) => setMax(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": `Maximum ${facet.name}` } }} />
        <Button type="submit" size="small" variant="outlined" sx={{ minWidth: 0, px: 1.5 }}>
          Go
        </Button>
      </Stack>
    </Box>
  );
}

export function FiltersPanel({ facets, params }: { facets: Facet[]; params: SearchParams }) {
  const { go, url } = useListingUrl(params);
  const keep = new Set(["q", "sort"]);
  const hasFilters = [...url.keys()].some((k) => !keep.has(k) && k !== "page");

  return (
    <Stack spacing={2.5} divider={<Divider flexItem />}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" component="h2">
          Filters
        </Typography>
        {hasFilters && (
          <Button size="small" onClick={() => go((u) => [...u.keys()].filter((k) => !keep.has(k)).forEach((k) => u.delete(k)))}>
            Clear all
          </Button>
        )}
      </Stack>
      <FormControlLabel
        control={<Switch checked={url.get("in_stock") === "1"} onChange={(e) => go((u) => (e.target.checked ? u.set("in_stock", "1") : u.delete("in_stock")))} />}
        label="In stock only"
      />
      {facets.map((facet) =>
        facet.type === "options" ? (
          facet.options.length > 0 && <OptionFacetView key={facet.code} facet={facet} params={params} />
        ) : facet.max > facet.min ? (
          <RangeFacetView key={`${facet.code}:${JSON.stringify(facet.selected)}`} facet={facet} params={params} />
        ) : null,
      )}
    </Stack>
  );
}

export function MobileFilters({ facets, params }: { facets: Facet[]; params: SearchParams }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setOpen(true)} sx={{ display: { md: "none" } }}>
        Filters
      </Button>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: "min(88vw, 360px)", p: 2.5 } } }}>
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Tooltip title="Close">
            <IconButton onClick={() => setOpen(false)} aria-label="Close filters">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <FiltersPanel facets={facets} params={params} />
      </Drawer>
    </>
  );
}

export function SortSelect({ params, value }: { params: SearchParams; value: string }) {
  const { go, pending } = useListingUrl(params);
  const options = params.q ? [{ value: "relevance", label: "Relevance" }, ...PRODUCT_SORTS] : PRODUCT_SORTS;

  return (
    <TextField select size="small" label="Sort by" value={value} disabled={pending} onChange={(e) => go((u) => u.set("sort", e.target.value))} sx={{ minWidth: 190 }}>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function ListingPagination({ params, page, lastPage }: { params: SearchParams; page: number; lastPage: number }) {
  const { go } = useListingUrl(params);
  if (lastPage <= 1) return null;

  return (
    <Stack sx={{ alignItems: "center", mt: 5 }}>
      <Pagination
        count={lastPage}
        page={page}
        color="primary"
        shape="rounded"
        onChange={(_, next) => {
          go((u) => (next === 1 ? u.delete("page") : u.set("page", String(next))), true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </Stack>
  );
}
