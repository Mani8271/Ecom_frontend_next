"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { userMessage } from "@/services/api/errors";
import type { AdminCategory, CategoryAttributes } from "@/services/admin/types";
import { EntityPicker, pickerSearch } from "../components/EntityPicker";
import { useNotify } from "../notify";
import { useCategoryAttributes, useCategoryMutations } from "./queries";

interface Row {
  attribute_id: number;
  name: string;
  code: string;
  canBeAxis: boolean;
  is_required: boolean;
  is_filterable: boolean | null;
  is_variant_axis: boolean;
}

function initialRows(data: CategoryAttributes): Row[] {
  const byId = new Map(data.effective.map((a) => [a.id, a]));
  return data.assigned.map((a) => ({
    attribute_id: a.attribute_id,
    name: a.name,
    code: a.code,
    canBeAxis: byId.get(a.attribute_id)?.can_be_variant_axis ?? false,
    is_required: a.is_required,
    is_filterable: a.is_filterable,
    is_variant_axis: a.is_variant_axis,
  }));
}

export function CategoryAttributesDialog({ category, onClose }: { category: AdminCategory; onClose: () => void }) {
  const { data, isLoading, error } = useCategoryAttributes(category.id);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="category-attributes-title">
      <DialogTitle id="category-attributes-title">Attributes for {category.name}</DialogTitle>
      {isLoading ? (
        <DialogContent>
          <FormSkeleton fields={4} />
        </DialogContent>
      ) : error || !data ? (
        <DialogContent>
          <Alert severity="error">{userMessage(error)}</Alert>
        </DialogContent>
      ) : (
        <AssignmentEditor category={category} data={data} onClose={onClose} />
      )}
    </Dialog>
  );
}

function AssignmentEditor({ category, data, onClose }: { category: AdminCategory; data: CategoryAttributes; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(data));
  const [formError, setFormError] = useState<string | null>(null);
  const { syncAttributes } = useCategoryMutations();
  const notify = useNotify();

  const assignedIds = new Set(rows.map((r) => r.attribute_id));
  const inherited = data.effective.filter((a) => a.inherited_from !== category.id && !assignedIds.has(a.id));

  const update = (index: number, patch: Partial<Row>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const move = (from: number, to: number) =>
    setRows((current) => {
      const next = [...current];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });

  async function save() {
    setFormError(null);
    try {
      await syncAttributes.mutateAsync({
        id: category.id,
        attributes: rows.map((row, index) => ({
          attribute_id: row.attribute_id,
          is_required: row.is_required,
          is_filterable: row.is_filterable,
          is_variant_axis: row.canBeAxis && row.is_variant_axis,
          sort_order: index,
        })),
      });
      notify.success("Category attributes saved.");
      onClose();
    } catch (err) {
      setFormError(userMessage(err));
    }
  }

  return (
    <>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Products in this category (and its sub-categories) get these fields in the product form. Sub-categories inherit them automatically.
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        {inherited.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Inherited from parent categories
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {inherited.map((a) => (
                <Chip
                  key={a.id}
                  variant="outlined"
                  label={`${a.name}${a.is_required ? " · required" : ""}${a.is_variant_axis ? " · variants" : ""}`}
                />
              ))}
            </Stack>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              Add one of these below to override its settings for this category.
            </Typography>
          </Box>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Assigned to this category
        </Typography>
        <Stack spacing={1} divider={<Divider flexItem />}>
          {rows.length === 0 && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nothing assigned directly yet.
            </Typography>
          )}
          {rows.map((row, index) => (
            <Stack key={row.attribute_id} direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" }, py: 0.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {row.code}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <FormControlLabel control={<Checkbox size="small" checked={row.is_required} onChange={(e) => update(index, { is_required: e.target.checked })} />} label="Required" />
                <Tooltip title={row.canBeAxis ? "Suggest this attribute for variants in the product form" : "Enable “Can create variants” on the attribute first"}>
                  <span>
                    <FormControlLabel
                      disabled={!row.canBeAxis}
                      control={<Checkbox size="small" checked={row.canBeAxis && row.is_variant_axis} onChange={(e) => update(index, { is_variant_axis: e.target.checked })} />}
                      label="Variants"
                    />
                  </span>
                </Tooltip>
                <TextField
                  select
                  size="small"
                  label="Filter"
                  value={row.is_filterable === null ? "default" : row.is_filterable ? "yes" : "no"}
                  onChange={(e) => update(index, { is_filterable: e.target.value === "default" ? null : e.target.value === "yes" })}
                  sx={{ width: 130 }}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="yes">Show</MenuItem>
                  <MenuItem value="no">Hide</MenuItem>
                </TextField>
                <IconButton size="small" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${row.name} up`}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={index === rows.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${row.name} down`}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setRows((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${row.name}`}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Box sx={{ mt: 2, maxWidth: 420 }}>
          <EntityPicker
            key={rows.length}
            label="Add attribute"
            entity="attributes"
            search={pickerSearch.attributes}
            value={null}
            size="small"
            onChange={(option) => {
              if (!option || assignedIds.has(option.id)) return;
              const effective = data.effective.find((a) => a.id === option.id);
              setRows((current) => [
                ...current,
                {
                  attribute_id: option.id,
                  name: option.label,
                  code: String(option.meta?.code ?? ""),
                  canBeAxis: option.meta?.canBeVariantAxis === true,
                  is_required: effective?.is_required ?? false,
                  is_filterable: null,
                  is_variant_axis: effective?.is_variant_axis ?? false,
                },
              ]);
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} loading={syncAttributes.isPending}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}
