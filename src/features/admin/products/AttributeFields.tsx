"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, type Control } from "react-hook-form";
import type { EffectiveAttribute } from "@/services/admin/types";
import type { AttributeFormValue } from "./attribute-values";
import type { ProductFormValues } from "./product-form-schema";

function Swatch({ color }: { color: string | null }) {
  if (!color) return null;
  return <Box component="span" sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: color, border: 1, borderColor: "divider", display: "inline-block", mr: 1, flexShrink: 0 }} />;
}

function AttributeInput({ attribute, control }: { attribute: EffectiveAttribute; control: Control<ProductFormValues> }) {
  const label = attribute.name;
  const required = attribute.is_required;

  return (
    <Controller
      control={control}
      name={`attributes.${attribute.code}`}
      render={({ field, fieldState }) => {
        const error = Boolean(fieldState.error);
        const helperText = fieldState.error?.message;
        const value = field.value as AttributeFormValue | undefined;
        const text = typeof value === "string" ? value : "";

        switch (attribute.type) {
          case "select":
          case "color":
            return (
              <TextField select label={label} required={required} value={text} onChange={field.onChange} onBlur={field.onBlur} error={error} helperText={helperText}>
                <MenuItem value="">
                  <em>Not set</em>
                </MenuItem>
                {attribute.options.map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    <Swatch color={option.swatch} />
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            );

          case "multiselect": {
            const selected = Array.isArray(value) ? value : [];
            return (
              <Autocomplete
                multiple
                options={attribute.options}
                value={attribute.options.filter((o) => selected.includes(o.id))}
                onChange={(_, next) => field.onChange(next.map((o) => o.id))}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                disableCloseOnSelect
                renderValue={(items, getItemProps) => items.map((o, index) => <Chip size="small" label={o.label} {...getItemProps({ index })} key={o.id} />)}
                renderInput={(params) => <TextField {...params} label={label} required={required} error={error} helperText={helperText} />}
              />
            );
          }

          case "boolean":
            return (
              <TextField select label={label} required={required} value={text} onChange={field.onChange} error={error} helperText={helperText}>
                <MenuItem value="">
                  <em>Not set</em>
                </MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
            );

          case "range": {
            const range = typeof value === "object" && !Array.isArray(value) ? value : { min: "", max: "" };
            const slotProps = { htmlInput: { inputMode: "decimal" as const }, ...(attribute.unit ? { input: { endAdornment: <InputAdornment position="end">{attribute.unit}</InputAdornment> } } : {}) };
            return (
              <Stack direction="row" spacing={1}>
                <TextField label={`${label} (min)`} required={required} value={range.min} onChange={(e) => field.onChange({ ...range, min: e.target.value })} error={error} helperText={helperText} slotProps={slotProps} />
                <TextField label={`${label} (max)`} required={required} value={range.max} onChange={(e) => field.onChange({ ...range, max: e.target.value })} error={error} slotProps={slotProps} />
              </Stack>
            );
          }

          case "number":
            return (
              <TextField
                label={label}
                required={required}
                value={text}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={error}
                helperText={helperText}
                slotProps={{
                  htmlInput: { inputMode: "decimal" },
                  ...(attribute.unit ? { input: { endAdornment: <InputAdornment position="end">{attribute.unit}</InputAdornment> } } : {}),
                }}
              />
            );

          case "date":
            return (
              <TextField type="date" label={label} required={required} value={text} onChange={field.onChange} error={error} helperText={helperText} slotProps={{ inputLabel: { shrink: true } }} />
            );

          default:
            return (
              <TextField
                label={label}
                required={required}
                value={text}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={error}
                helperText={helperText}
                multiline={(attribute.validation?.max_length ?? 1000) > 200}
                slotProps={{ htmlInput: { maxLength: attribute.validation?.max_length ?? 1000 } }}
              />
            );
        }
      }}
    />
  );
}

/** Renders the category's spec attributes, grouped like the product page will show them. */
export function AttributeFields({ attributes, control }: { attributes: EffectiveAttribute[]; control: Control<ProductFormValues> }) {
  if (attributes.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        This category has no specification attributes. Assign some under Categories → ⚙ Attributes.
      </Typography>
    );
  }

  const groups = new Map<string, EffectiveAttribute[]>();
  for (const attribute of attributes) {
    const key = attribute.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), attribute]);
  }

  return (
    <Stack spacing={2.5}>
      {[...groups.entries()].map(([group, items]) => (
        <Box key={group || "general"}>
          {group && (
            <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              {group}
            </Typography>
          )}
          <Grid container spacing={2}>
            {items.map((attribute) => (
              <Grid key={attribute.code} size={{ xs: 12, sm: attribute.type === "range" || attribute.type === "multiselect" ? 12 : 6 }}>
                <AttributeInput attribute={attribute} control={control} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Stack>
  );
}
