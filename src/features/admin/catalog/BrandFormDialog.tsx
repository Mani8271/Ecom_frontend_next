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
import type { AdminBrand } from "@/services/admin/types";
import { ImageUploadField, type UploadedImage } from "../components/ImageUploadField";
import { useNotify } from "../notify";
import { useBrandMutations } from "./queries";

const brandSchema = z.object({
  name: z.string().trim().min(1, "Enter the brand name").max(150),
  slug: optionalSlugSchema,
  description: z.string().max(5000),
  meta_title: z.string().max(255),
  meta_description: z.string().max(500),
  sort_order: intString(),
  is_active: z.boolean(),
  logo: z.custom<UploadedImage | null>(),
});
type BrandValues = z.infer<typeof brandSchema>;
const FIELDS = ["name", "slug", "description", "meta_title", "meta_description", "sort_order", "is_active"] as const;

function toValues(brand?: AdminBrand): BrandValues {
  return {
    name: brand?.name ?? "",
    slug: brand?.slug ?? "",
    description: brand?.description ?? "",
    meta_title: brand?.meta_title ?? "",
    meta_description: brand?.meta_description ?? "",
    sort_order: String(brand?.sort_order ?? 0),
    is_active: brand?.is_active ?? true,
    logo: brand?.logo?.id ? { id: brand.logo.id, url: brand.logo.sm ?? brand.logo.thumb } : null,
  };
}

export function BrandFormDialog({ open, brand, onClose }: { open: boolean; brand?: AdminBrand; onClose: () => void }) {
  const { save } = useBrandMutations();
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError } = useForm<BrandValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: toValues(brand),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync({
        id: brand?.id,
        input: {
          name: values.name,
          slug: orNull(values.slug),
          description: orNull(values.description),
          meta_title: orNull(values.meta_title),
          meta_description: orNull(values.meta_description),
          sort_order: Number(values.sort_order || 0),
          is_active: values.is_active,
          logo_id: values.logo?.id ?? null,
        },
      });
      notify.success(brand ? "Brand updated." : "Brand created.");
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="brand-dialog-title">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="brand-dialog-title">{brand ? `Edit ${brand.name}` : "Add brand"}</DialogTitle>
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
              <FormTextField control={control} name="description" label="Description" multiline minRows={3} />
            </Grid>
            <Grid size={12}>
              <Controller control={control} name="logo" render={({ field }) => <ImageUploadField label="Logo" value={field.value ?? null} onChange={field.onChange} />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormTextField control={control} name="sort_order" label="Sort order" type="number" />
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
