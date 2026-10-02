"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch, type UseFormSetError } from "react-hook-form";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { routes } from "@/config/routes";
import { isApiError, userMessage } from "@/services/api/errors";
import { PRODUCT_STATUSES, PRODUCT_VISIBILITIES, type AdminProduct, type EffectiveAttribute } from "@/services/admin/types";
import { useCategoryAttributes, useTaxClasses } from "../catalog/queries";
import { EntityPicker, pickerSearch } from "../components/EntityPicker";
import { useNotify } from "../notify";
import { AttributeFields } from "./AttributeFields";
import { emptyProductValues, PRODUCT_FIELDS, productSchema, productToValues, valuesToFields, type ProductFormValues } from "./product-form-schema";
import { useProductEditor, useProductMutations } from "./queries";
import { emptyVariantPlan, planToRequest, VariantBuilder, type VariantPlan } from "./VariantBuilder";

const VISIBILITY_LABELS: Record<(typeof PRODUCT_VISIBILITIES)[number], string> = {
  everywhere: "Catalog & search",
  catalog: "Catalog only",
  search: "Search only",
  hidden: "Hidden (direct link only)",
};

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {description}
          </Typography>
        )}
        <Box sx={{ mt: 2.5 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

const FIELD_ALIASES: Record<string, string> = { primary_category_id: "category", brand_id: "brand" };

/**
 * Maps a 422 onto the form. Returns a message for errors that have no field
 * on screen (variants, unknown keys).
 */
function applyProductErrors(error: unknown, setError: UseFormSetError<ProductFormValues>, specs: EffectiveAttribute[]): string | null {
  if (!isApiError(error) || !error.isValidation) return userMessage(error);

  const known = new Set<string>([...PRODUCT_FIELDS, "category", "brand", ...specs.map((a) => `attributes.${a.code}`)]);
  const leftovers: string[] = [];

  for (const [key, messages] of Object.entries(error.errors)) {
    const field = FIELD_ALIASES[key] ?? key.replace(/^(attributes\.[^.]+)\..*$/, "$1");
    if (known.has(field)) {
      setError(field as keyof ProductFormValues, { type: "server", message: messages[0] });
    } else {
      leftovers.push(messages[0]);
    }
  }

  return leftovers.length ? leftovers.slice(0, 3).join(" ") : "Please fix the highlighted fields.";
}

/** Create: full form incl. variants. Edit: product fields only (variants/images have their own tabs). */
export function ProductForm({ product }: { product?: AdminProduct }) {
  const { data: taxClasses, isLoading: taxLoading } = useTaxClasses();
  const { data: initialCategory, isLoading: attrsLoading } = useCategoryAttributes(product?.primary_category_id);

  if (taxLoading || (product && attrsLoading)) return <FormSkeleton fields={6} />;

  const defaultTax = taxClasses?.find((t) => t.is_default)?.id;
  const defaults = product ? productToValues(product, initialCategory?.effective ?? []) : emptyProductValues(defaultTax);

  return <ProductFormInner key={product?.id ?? "new"} product={product} defaults={defaults} taxClasses={taxClasses ?? []} />;
}

function ProductFormInner({ product, defaults, taxClasses }: { product?: AdminProduct; defaults: ProductFormValues; taxClasses: { id: number; name: string }[] }) {
  const router = useRouter();
  const notify = useNotify();
  const { create } = useProductMutations();
  const { update } = useProductEditor(product?.id ?? 0);
  const [plan, setPlan] = useState<VariantPlan>(emptyVariantPlan);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, setError, reset, formState } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults,
  });
  const category = useWatch({ control, name: "category" });
  const { data: categoryAttributes, isFetching: attributesLoading } = useCategoryAttributes(category?.id);
  const effective = categoryAttributes?.effective ?? [];

  const axisCodes = product ? product.variant_axes.map((a) => a.code) : plan.mode === "variants" ? plan.axes.map((a) => a.code) : [];
  const specs = effective.filter((a) => !axisCodes.includes(a.code));
  const candidates = effective.filter((a) => a.can_be_variant_axis);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const fields = valuesToFields(values, specs);

    try {
      if (product) {
        const { data } = await update.mutateAsync(fields);
        reset(productToValues(data, effective));
        notify.success("Product saved.");
        return;
      }

      const variants = planToRequest(plan, candidates);
      if ("error" in variants) {
        setFormError(variants.error);
        return;
      }
      const { data } = await create.mutateAsync({ ...fields, ...variants });
      notify.success("Product created. Now add images.");
      router.replace(routes.admin.product(data.id, "images"));
    } catch (error) {
      setFormError(applyProductErrors(error, setError, specs));
    }
  });

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Section title="Basic details">
              <Grid container spacing={2}>
                <Grid size={12}>
                  <FormTextField control={control} name="name" label="Product name" required autoFocus={!product} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormTextField control={control} name="style_code" label="Style code" helperText="Your internal design / model number (optional)" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormTextField control={control} name="slug" label="URL slug" helperText="Leave empty to generate from the name" />
                </Grid>
                <Grid size={12}>
                  <FormTextField control={control} name="short_description" label="Short description" multiline minRows={2} helperText="One or two lines shown near the price" />
                </Grid>
                <Grid size={12}>
                  <FormTextField
                    control={control}
                    name="description"
                    label="Full description"
                    multiline
                    minRows={6}
                    helperText="Basic HTML (<p>, <ul>, <strong>…) is allowed; anything unsafe is removed."
                  />
                </Grid>
                <Grid size={12}>
                  <FormTextField control={control} name="features" label="Key features" multiline minRows={3} helperText="One per line, e.g. Breathable cotton · Machine washable (max 20)" />
                </Grid>
              </Grid>
            </Section>

            <Section
              title="Specifications"
              description={category ? `Fields come from the “${category.label}” category and its parents.` : "Choose a category first; its attributes appear here."}
            >
              {!category ? null : attributesLoading && !categoryAttributes ? <FormSkeleton fields={2} /> : <AttributeFields attributes={specs} control={control} />}
            </Section>

            {!product && (
              <Section title="Price, stock & variants" description="Sell one item, or create variants for each size, color, storage option…">
                {category ? (
                  <VariantBuilder plan={plan} onChange={setPlan} candidates={candidates} />
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Choose a category first.
                  </Typography>
                )}
              </Section>
            )}

            <Section title="Shipping" description="Used to calculate delivery charges.">
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormTextField control={control} name="weight_grams" label="Weight (g)" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormTextField control={control} name="length_mm" label="Length (mm)" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormTextField control={control} name="width_mm" label="Width (mm)" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormTextField control={control} name="height_mm" label="Height (mm)" />
                </Grid>
              </Grid>
            </Section>

            <Section title="Search engine listing">
              <Stack spacing={2}>
                <FormTextField control={control} name="meta_title" label="SEO title" helperText="Defaults to the product name" />
                <FormTextField control={control} name="meta_description" label="SEO description" multiline minRows={2} helperText="Defaults to the short description" />
                <FormTextField control={control} name="meta_keywords" label="SEO keywords" />
              </Stack>
            </Section>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Section title="Status">
              <Stack spacing={2}>
                <FormTextField control={control} name="status" label="Status" select helperText="Only Active products are visible to shoppers">
                  {PRODUCT_STATUSES.map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                      {s}
                    </MenuItem>
                  ))}
                </FormTextField>
                <FormTextField control={control} name="visibility" label="Visibility" select>
                  {PRODUCT_VISIBILITIES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {VISIBILITY_LABELS[v]}
                    </MenuItem>
                  ))}
                </FormTextField>
                <Box>
                  <FormSwitch control={control} name="is_featured" label="Featured" />
                  <FormSwitch control={control} name="is_new_arrival" label="New arrival" />
                  <FormSwitch control={control} name="is_bestseller" label="Bestseller" />
                </Box>
              </Stack>
            </Section>

            <Section title="Organisation">
              <Stack spacing={2}>
                <Controller
                  control={control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <EntityPicker
                      label="Category"
                      required
                      entity="categories"
                      search={pickerSearch.categories}
                      value={field.value ?? null}
                      onChange={(value) => {
                        field.onChange(value);
                        // Variant attributes depend on the category.
                        if (!product) setPlan((p) => ({ ...p, axes: [], edits: {}, excluded: [] }));
                      }}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message ?? "Decides which specification fields and filters apply"}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="brand"
                  render={({ field }) => <EntityPicker label="Brand" entity="brands" search={pickerSearch.brands} value={field.value ?? null} onChange={field.onChange} />}
                />
                <Controller
                  control={control}
                  name="tags"
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[] as string[]}
                      value={field.value}
                      onChange={(_, next) => field.onChange(next.map((t) => t.trim()).filter(Boolean))}
                      renderValue={(items, getItemProps) => items.map((tag, index) => <Chip size="small" label={tag} {...getItemProps({ index })} key={tag} />)}
                      renderInput={(params) => (
                        <TextField {...params} label="Tags" placeholder="Type and press Enter" error={Boolean(fieldState.error)} helperText={fieldState.error?.message ?? "Help shoppers find the product in search"} />
                      )}
                    />
                  )}
                />
              </Stack>
            </Section>

            <Section title="Tax (GST)">
              <Stack spacing={2}>
                <FormTextField control={control} name="tax_class_id" label="Tax class" select>
                  <MenuItem value="">
                    <em>Default</em>
                  </MenuItem>
                  {taxClasses.map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </MenuItem>
                  ))}
                </FormTextField>
                <FormTextField control={control} name="hsn_code" label="HSN code" helperText="Overrides the tax class HSN code" />
                <FormTextField control={control} name="low_stock_threshold" label="Low-stock alert at" helperText="Warn when a variant's stock falls to this number" />
              </Stack>
            </Section>
          </Stack>
        </Grid>
      </Grid>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          mt: 3,
          mx: { xs: -2, md: -4 },
          px: { xs: 2, md: 4 },
          py: 1.5,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          alignItems: "center",
        }}
      >
        {product && formState.isDirty && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Unsaved changes
          </Typography>
        )}
        <SubmitButton size="medium" pending={pending} disabled={Boolean(product) && !formState.isDirty}>
          {product ? "Save changes" : "Create product"}
        </SubmitButton>
      </Box>
    </form>
  );
}
