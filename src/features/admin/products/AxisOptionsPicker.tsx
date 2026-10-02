"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { EffectiveAttribute } from "@/services/admin/types";

export interface AxisSelection {
  code: string;
  optionIds: number[];
}

export const MAX_AXES = 3;
export const MAX_VARIANTS = 250;

interface AxisOptionsPickerProps {
  /** Attributes of the category that can create variants. */
  candidates: EffectiveAttribute[];
  value: AxisSelection[];
  onChange: (value: AxisSelection[]) => void;
  /** Axes can't change once a product has variants; only options can be added. */
  lockAxes?: boolean;
  /** Options that already exist (shown selected and not removable). */
  existing?: Record<string, number[]>;
}

/** Choose variant axes (e.g. Color, Size) and which of their options to sell. */
export function AxisOptionsPicker({ candidates, value, onChange, lockAxes, existing = {} }: AxisOptionsPickerProps) {
  const byCode = new Map(candidates.map((a) => [a.code, a]));
  const selectedAttributes = value.map((axis) => byCode.get(axis.code)).filter((a): a is EffectiveAttribute => Boolean(a));

  const setOptions = (code: string, optionIds: number[]) => onChange(value.map((axis) => (axis.code === code ? { ...axis, optionIds } : axis)));

  return (
    <Stack spacing={2.5}>
      {!lockAxes && (
        <Autocomplete
          multiple
          options={candidates}
          value={selectedAttributes}
          onChange={(_, next) => {
            const kept = new Map(value.map((axis) => [axis.code, axis]));
            onChange(next.slice(0, MAX_AXES).map((a) => kept.get(a.code) ?? { code: a.code, optionIds: [] }));
          }}
          getOptionLabel={(a) => a.name}
          isOptionEqualToValue={(a, b) => a.code === b.code}
          getOptionDisabled={() => value.length >= MAX_AXES}
          renderValue={(items, getItemProps) => items.map((a, index) => <Chip label={a.name} {...getItemProps({ index })} key={a.code} />)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Variants differ by"
              placeholder={value.length ? "" : "e.g. Color, Size"}
              helperText={
                candidates.length === 0
                  ? "No attribute in this category can create variants. Mark one with “Can create variants” under Attributes and assign it to the category."
                  : `Up to ${MAX_AXES}. The order sets how the product page groups options.`
              }
            />
          )}
        />
      )}

      {selectedAttributes.map((attribute) => {
        const axis = value.find((a) => a.code === attribute.code) as AxisSelection;
        const locked = new Set(existing[attribute.code] ?? []);
        const toggle = (optionId: number) =>
          setOptions(attribute.code, axis.optionIds.includes(optionId) ? axis.optionIds.filter((id) => id !== optionId) : [...axis.optionIds, optionId]);

        return (
          <Box key={attribute.code}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2">{attribute.name}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {axis.optionIds.length} selected
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => setOptions(attribute.code, attribute.options.map((o) => o.id))}>
                All
              </Button>
              <Button size="small" onClick={() => setOptions(attribute.code, [...locked])}>
                None
              </Button>
            </Stack>
            {attribute.options.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {attribute.name} has no options yet. Add them under Attributes.
              </Typography>
            ) : (
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                {attribute.options.map((option) => {
                  const selected = axis.optionIds.includes(option.id);
                  const isExisting = locked.has(option.id);
                  return (
                    <Chip
                      key={option.id}
                      label={option.label}
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      onClick={isExisting ? undefined : () => toggle(option.id)}
                      aria-pressed={selected}
                      icon={option.swatch ? <Box component="span" sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: option.swatch, border: 1, borderColor: "divider" }} /> : undefined}
                    />
                  );
                })}
              </Stack>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

/** Cartesian product of the selected options, in axis order. */
export function combinations(axes: AxisSelection[], candidates: EffectiveAttribute[]): { key: string; options: Record<string, number>; label: string }[] {
  const byCode = new Map(candidates.map((a) => [a.code, a]));
  let combos: { options: Record<string, number>; labels: string[] }[] = [{ options: {}, labels: [] }];

  for (const axis of axes) {
    const attribute = byCode.get(axis.code);
    if (!attribute || axis.optionIds.length === 0) return [];
    // Keep the attribute's own option order (S, M, L…) regardless of click order.
    const ordered = attribute.options.filter((o) => axis.optionIds.includes(o.id));
    combos = combos.flatMap((combo) => ordered.map((o) => ({ options: { ...combo.options, [axis.code]: o.id }, labels: [...combo.labels, o.label] })));
  }

  return combos.map((combo) => ({
    key: axes.map((axis) => `${axis.code}:${combo.options[axis.code]}`).join("|"),
    options: combo.options,
    label: combo.labels.join(" / "),
  }));
}
