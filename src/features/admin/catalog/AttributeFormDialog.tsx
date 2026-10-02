"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { applyServerErrors, numberOrNull, orNull } from "@/lib/forms";
import { intString } from "@/lib/validation";
import { ATTRIBUTE_TYPES, AXIS_TYPES, DISPLAY_TYPES, OPTION_TYPES, type AdminAttribute, type AttributeInput, type AttributeType } from "@/services/admin/types";
import { colors } from "@/theme/colors";
import { useNotify } from "../notify";
import { useAttribute, useAttributeGroups, useAttributeMutations } from "./queries";

export const TYPE_LABELS: Record<AttributeType, string> = {
  text: "Text",
  number: "Number",
  boolean: "Yes / No",
  select: "Single choice",
  multiselect: "Multiple choice",
  color: "Color (with swatches)",
  date: "Date",
  range: "Range (min–max)",
};

const signedDecimal = z.string().trim().regex(/^(-?\d+(\.\d+)?)?$/, "Enter a number");

const attributeSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  code: z
    .string()
    .trim()
    .max(64)
    .regex(/^([a-z][a-z0-9_]*)?$/, "Lowercase letters, numbers and underscores, starting with a letter"),
  type: z.enum(ATTRIBUTE_TYPES),
  unit: z.string().max(20),
  display_type: z.enum(DISPLAY_TYPES),
  attribute_group_id: z.string(),
  is_filterable: z.boolean(),
  is_searchable: z.boolean(),
  is_comparable: z.boolean(),
  can_be_variant_axis: z.boolean(),
  min: signedDecimal,
  max: signedDecimal,
  max_length: intString(),
  sort_order: intString(),
  options: z.array(
    z.object({
      optionId: z.number().optional(),
      label: z.string().trim().min(1, "Enter a label").max(120),
      swatch_value: z.string().regex(/^(#[0-9a-fA-F]{6})?$/, "Use a hex color"),
    }),
  ),
});
type AttributeValues = z.infer<typeof attributeSchema>;
const FIELDS = ["name", "code", "type", "unit", "display_type", "sort_order"] as const;

function toValues(attribute?: AdminAttribute): AttributeValues {
  return {
    name: attribute?.name ?? "",
    code: attribute?.code ?? "",
    type: attribute?.type ?? "select",
    unit: attribute?.unit ?? "",
    display_type: attribute?.display_type ?? "default",
    attribute_group_id: attribute?.attribute_group_id ? String(attribute.attribute_group_id) : "",
    is_filterable: attribute?.is_filterable ?? true,
    is_searchable: attribute?.is_searchable ?? false,
    is_comparable: attribute?.is_comparable ?? false,
    can_be_variant_axis: attribute?.can_be_variant_axis ?? false,
    min: attribute?.validation?.min?.toString() ?? "",
    max: attribute?.validation?.max?.toString() ?? "",
    max_length: attribute?.validation?.max_length?.toString() ?? "",
    sort_order: String(attribute?.sort_order ?? 0),
    options: (attribute?.options ?? []).map((o) => ({ optionId: o.id, label: o.label, swatch_value: o.swatch_value ?? "" })),
  };
}

function toInput(values: AttributeValues, creating: boolean): AttributeInput {
  const usesOptions = OPTION_TYPES.includes(values.type);
  const numeric = values.type === "number" || values.type === "range";
  const validation = numeric
    ? { min: numberOrNull(values.min), max: numberOrNull(values.max) }
    : values.type === "text"
      ? { max_length: numberOrNull(values.max_length) }
      : null;

  return {
    name: values.name,
    ...(creating ? { code: values.code || undefined, type: values.type } : { type: values.type }),
    unit: numeric ? orNull(values.unit) : null,
    display_type: values.display_type,
    attribute_group_id: numberOrNull(values.attribute_group_id),
    is_filterable: values.is_filterable,
    is_searchable: values.is_searchable,
    is_comparable: values.is_comparable,
    can_be_variant_axis: AXIS_TYPES.includes(values.type) && values.can_be_variant_axis,
    validation,
    sort_order: Number(values.sort_order || 0),
    ...(usesOptions
      ? {
          options: values.options.map((o, index) => ({
            ...(o.optionId ? { id: o.optionId } : {}),
            label: o.label,
            swatch_value: values.type === "color" ? orNull(o.swatch_value) : null,
            sort_order: index,
          })),
        }
      : {}),
  };
}

export function AttributeFormDialog({ attributeId, onClose }: { attributeId?: number; onClose: () => void }) {
  const { data: attribute, isLoading, error } = useAttribute(attributeId);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="attribute-dialog-title">
      <DialogTitle id="attribute-dialog-title">{attributeId ? `Edit ${attribute?.name ?? "attribute"}` : "Add attribute"}</DialogTitle>
      {attributeId && isLoading ? (
        <DialogContent>
          <FormSkeleton fields={5} />
        </DialogContent>
      ) : error ? (
        <DialogContent>
          <Alert severity="error">Couldn&apos;t load this attribute.</Alert>
        </DialogContent>
      ) : (
        <AttributeForm attribute={attribute} onClose={onClose} />
      )}
    </Dialog>
  );
}

function AttributeForm({ attribute, onClose }: { attribute?: AdminAttribute; onClose: () => void }) {
  const creating = !attribute;
  const { save } = useAttributeMutations();
  const { data: groups = [] } = useAttributeGroups();
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError } = useForm<AttributeValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: toValues(attribute),
  });
  const options = useFieldArray({ control, name: "options" });
  const type = useWatch({ control, name: "type" });
  const usesOptions = OPTION_TYPES.includes(type);
  const numeric = type === "number" || type === "range";

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (OPTION_TYPES.includes(values.type) && values.options.length === 0) {
      setFormError("Add at least one option.");
      return;
    }
    try {
      await save.mutateAsync({ id: attribute?.id, input: toInput(values, creating) });
      notify.success(creating ? "Attribute created." : "Attribute updated.");
      onClose();
    } catch (err) {
      setFormError(applyServerErrors(err, setError, FIELDS));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField control={control} name="name" label="Name" required autoFocus helperText="Shown to shoppers, e.g. Fabric, RAM, Pack size" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              control={control}
              name="code"
              label="Code"
              disabled={!creating}
              helperText={creating ? "Used in filter URLs. Leave empty to generate from the name." : "The code can't change (filter links use it)."}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField control={control} name="type" label="Type" select disabled={!creating} helperText={creating ? undefined : "The type can't change after creation."}>
              {ATTRIBUTE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {TYPE_LABELS[t]}
                </MenuItem>
              ))}
            </FormTextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField control={control} name="attribute_group_id" label="Group" select helperText="Groups specs on the product page">
              <MenuItem value="">None</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={String(g.id)}>
                  {g.name}
                </MenuItem>
              ))}
            </FormTextField>
          </Grid>
          {usesOptions && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="display_type" label="Display as" select>
                {DISPLAY_TYPES.map((d) => (
                  <MenuItem key={d} value={d} sx={{ textTransform: "capitalize" }}>
                    {d}
                  </MenuItem>
                ))}
              </FormTextField>
            </Grid>
          )}
          {numeric && (
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormTextField control={control} name="unit" label="Unit" helperText="e.g. mAh, GB, kg" />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormTextField control={control} name="min" label="Minimum" />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormTextField control={control} name="max" label="Maximum" />
              </Grid>
            </>
          )}
          {type === "text" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="max_length" label="Max length" />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField control={control} name="sort_order" label="Sort order" />
          </Grid>
        </Grid>

        <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 3, mt: 2 }}>
          <FormSwitch control={control} name="is_filterable" label="Shoppers can filter by it" />
          <FormSwitch control={control} name="is_searchable" label="Include in search" />
          <FormSwitch control={control} name="is_comparable" label="Show in comparisons" />
          {AXIS_TYPES.includes(type) && <FormSwitch control={control} name="can_be_variant_axis" label="Can create variants (e.g. Size, Color)" />}
        </Stack>

        {usesOptions && (
          <>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="subtitle1">Options ({options.fields.length})</Typography>
              <Button startIcon={<AddIcon />} onClick={() => options.append({ label: "", swatch_value: "" }, { shouldFocus: true })}>
                Add option
              </Button>
            </Stack>
            {options.fields.length === 0 && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No options yet. Add the values admins can pick, e.g. S, M, L or Cotton, Silk.
              </Typography>
            )}
            <Stack spacing={1}>
              {options.fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", width: 24, pt: 1.25, textAlign: "right" }}>
                    {index + 1}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <FormTextField control={control} name={`options.${index}.label`} size="small" placeholder="Label" slotProps={{ htmlInput: { "aria-label": `Option ${index + 1} label` } }} />
                  </Box>
                  {type === "color" && (
                    <Controller
                      control={control}
                      name={`options.${index}.swatch_value`}
                      render={({ field: swatch, fieldState }) => (
                        <TextField
                          size="small"
                          type="color"
                          value={swatch.value || colors.neutral.black}
                          onChange={swatch.onChange}
                          error={Boolean(fieldState.error)}
                          sx={{ width: 64 }}
                          slotProps={{ htmlInput: { "aria-label": `Option ${index + 1} swatch` } }}
                        />
                      )}
                    />
                  )}
                  <IconButton size="small" disabled={index === 0} onClick={() => options.move(index, index - 1)} aria-label="Move up">
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" disabled={index === options.fields.length - 1} onClick={() => options.move(index, index + 1)} aria-label="Move down">
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => options.remove(index)} aria-label="Remove option">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            {!creating && (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.5 }}>
                Options already used by products can&apos;t be removed; rename them instead.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <SubmitButton size="medium" pending={save.isPending}>
          Save
        </SubmitButton>
      </DialogActions>
    </form>
  );
}
