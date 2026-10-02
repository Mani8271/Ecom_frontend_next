"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { applyServerErrors, orNull } from "@/lib/forms";
import { intString, optionalSlugSchema } from "@/lib/validation";
import type { AdminCategory } from "@/services/admin/types";
import { EntityPicker, pickerSearch, type PickerOption } from "../components/EntityPicker";
import { ImageUploadField, type UploadedImage } from "../components/ImageUploadField";
import { useNotify } from "../notify";
import { useCategoryMutations } from "./queries";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter the category name").max(150),
  slug: optionalSlugSchema,
  parent: z.custom<PickerOption | null>(),
  description: z.string().max(5000),
  sort_order: intString(),
  is_active: z.boolean(),
  image: z.custom<UploadedImage | null>(),
  meta_title: z.string().max(255),
  meta_description: z.string().max(500),
  meta_keywords: z.string().max(500),
});
type CategoryValues = z.infer<typeof categorySchema>;
const FIELDS = ["name", "slug", "description", "sort_order", "meta_title", "meta_description", "meta_keywords"] as const;

function toValues(category?: AdminCategory, parent?: PickerOption | null): CategoryValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    parent: category ? (category.parent ? { id: category.parent.id, label: category.parent.name } : null) : (parent ?? null),
    description: category?.description ?? "",
    sort_order: String(category?.sort_order ?? 0),
    is_active: category?.is_active ?? true,
    image: category?.image?.id ? { id: category.image.id, url: category.image.sm ?? category.image.thumb } : null,
    meta_title: category?.meta_title ?? "",
    meta_description: category?.meta_description ?? "",
    meta_keywords: category?.meta_keywords ?? "",
  };
}

interface CategoryFormDialogProps {
  category?: AdminCategory;
  /** Preselected parent when adding a sub-category. */
  parent?: PickerOption | null;
  onClose: () => void;
}

export function CategoryFormDialog({ category, parent, onClose }: CategoryFormDialogProps) {
  const { save } = useCategoryMutations();
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: toValues(category, parent),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync({
        id: category?.id,
        input: {
          name: values.name,
          slug: orNull(values.slug),
          parent_id: values.parent?.id ?? null,
          description: orNull(values.description),
          sort_order: Number(values.sort_order || 0),
          is_active: values.is_active,
          image_id: values.image?.id ?? null,
          meta_title: orNull(values.meta_title),
          meta_description: orNull(values.meta_description),
          meta_keywords: orNull(values.meta_keywords),
        },
      });
      notify.success(category ? "Category updated." : "Category created.");
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS));
    }
  });

  const title = category ? `Edit ${category.name}` : parent ? `Add sub-category to ${parent.label}` : "Add category";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="category-dialog-title">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="category-dialog-title">{title}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <FormTextField control={control} name="name" label="Name" required autoFocus />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <FormTextField control={control} name="slug" label="URL slug" helperText="Leave empty to generate" />
            </Grid>
            <Grid size={12}>
              <Controller
                control={control}
                name="parent"
                render={({ field }) => (
                  <EntityPicker
                    label="Parent category"
                    entity="categories"
                    search={pickerSearch.categories}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    helperText="Empty = top-level category. Moving a category moves its sub-categories too."
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <FormTextField control={control} name="description" label="Description" multiline minRows={3} />
            </Grid>
            <Grid size={12}>
              <Controller control={control} name="image" render={({ field }) => <ImageUploadField label="Image" value={field.value ?? null} onChange={field.onChange} />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormTextField control={control} name="sort_order" label="Sort order" />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormSwitch control={control} name="is_active" label="Active (visible in the store)" />
            </Grid>
            <Grid size={12}>
              <FormTextField control={control} name="meta_title" label="SEO title" />
            </Grid>
            <Grid size={12}>
              <FormTextField control={control} name="meta_description" label="SEO description" multiline minRows={2} />
            </Grid>
            <Grid size={12}>
              <FormTextField control={control} name="meta_keywords" label="SEO keywords" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <SubmitButton size="medium" pending={save.isPending}>
            Save
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
