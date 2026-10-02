"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { adminCatalogService as api } from "@/services/admin/catalog.service";

export interface PickerOption {
  id: number;
  label: string;
  hint?: string;
  /** Extra flags a caller may need after selection. */
  meta?: Record<string, string | boolean>;
}

interface EntityPickerProps {
  label: string;
  value: PickerOption | null;
  onChange: (value: PickerOption | null) => void;
  /** Stable cache key for this entity type. */
  entity: string;
  search: (q: string) => Promise<PickerOption[]>;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  size?: "small" | "medium";
}

/** Server-side searched autocomplete (never loads a whole table). */
export function EntityPicker({ label, value, onChange, entity, search, error, helperText, disabled, required, size }: EntityPickerProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const term = useDebouncedValue(input.trim());
  // Typing the selected label again shouldn't trigger a search for it.
  const q = value && term === value.label ? "" : term;

  const { data = [], isFetching } = useQuery({
    queryKey: ["admin", "picker", entity, q],
    queryFn: () => search(q),
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, next) => onChange(next)}
      inputValue={input}
      onInputChange={(_, next) => setInput(next)}
      options={data}
      loading={isFetching}
      filterOptions={(options) => options}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(option) => option.label}
      disabled={disabled}
      size={size}
      renderOption={({ key, ...props }, option) => (
        <li key={key} {...props}>
          <div>
            <Typography variant="body2">{option.label}</Typography>
            {option.hint && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {option.hint}
              </Typography>
            )}
          </div>
        </li>
      )}
      renderInput={(params) => <TextField {...params} label={label} required={required} error={error} helperText={helperText} />}
    />
  );
}

export const pickerSearch = {
  categories: async (q: string): Promise<PickerOption[]> => {
    const { data } = await api.categories({ q: q || undefined, limit: 30, sort: "position" });
    return data.map((c) => ({ id: c.id, label: c.name, hint: c.parent ? `in ${c.parent.name}` : "Top level" }));
  },
  brands: async (q: string): Promise<PickerOption[]> => {
    const { data } = await api.brands({ q: q || undefined, limit: 30, sort: "name" });
    return data.map((b) => ({ id: b.id, label: b.name, hint: b.is_active ? undefined : "Inactive" }));
  },
  attributes: async (q: string): Promise<PickerOption[]> => {
    const { data } = await api.attributes({ q: q || undefined, limit: 30, sort: "name" });
    return data.map((a) => ({ id: a.id, label: a.name, hint: `${a.code} · ${a.type}${a.can_be_variant_axis ? " · can create variants" : ""}`, meta: { code: a.code, canBeVariantAxis: a.can_be_variant_axis } }));
  },
};
