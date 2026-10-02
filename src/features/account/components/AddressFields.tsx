"use client";

import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { z } from "zod";
import { FormTextField } from "@/components/forms/FormTextField";
import { indianStates } from "@/config/india-states";
import { mobileSchema, pinCodeSchema } from "@/lib/validation";
import type { Address, AddressInput } from "@/services/account/types";

/** Indian address rules (the API validates again). */
export const addressFieldsSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's name").max(120),
  phone: mobileSchema,
  line1: z.string().trim().min(1, "Enter house / flat no. and building").max(255),
  line2: z.string().trim().max(255),
  area: z.string().trim().max(150),
  landmark: z.string().trim().max(120),
  city: z.string().trim().min(2, "Enter the village / town / city").max(100),
  district: z.string().trim().max(100),
  state_code: z.string().min(1, "Select a state"),
  postal_code: pinCodeSchema,
  address_type: z.enum(["home", "work", "other"]),
});
export type AddressFieldValues = z.infer<typeof addressFieldsSchema>;

export const ADDRESS_FIELDS = ["name", "phone", "line1", "line2", "area", "landmark", "city", "district", "state_code", "postal_code"] as const;

export function addressToValues(address?: Partial<Address>): AddressFieldValues {
  return {
    name: address?.name ?? "",
    phone: address?.phone?.replace(/^\+91/, "") ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    area: address?.area ?? "",
    landmark: address?.landmark ?? "",
    city: address?.city ?? "",
    district: address?.district ?? "",
    state_code: address?.state_code ?? "",
    postal_code: address?.postal_code ?? "",
    address_type: address?.address_type ?? "home",
  };
}

export function valuesToAddressInput(values: AddressFieldValues): AddressInput {
  const state = indianStates.find((s) => s.code === values.state_code);
  return {
    ...values,
    label: null,
    line2: values.line2 || null,
    area: values.area || null,
    landmark: values.landmark || null,
    district: values.district || null,
    state: state?.name ?? "",
    country_code: "IN",
  };
}

/** The address inputs; used by the address dialog and guest checkout. `prefix` nests them in a bigger form. */
export function AddressFields<T extends FieldValues>({ control, prefix = "" }: { control: Control<T>; prefix?: string }) {
  const n = (name: keyof AddressFieldValues) => `${prefix}${name}` as Path<T>;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("name")} label="Full name" autoComplete="name" required />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("phone")} label="Mobile number" type="tel" autoComplete="tel-national" required slotProps={{ htmlInput: { inputMode: "tel", maxLength: 14 } }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("line1")} label="House / Flat no., Building" autoComplete="address-line1" required />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("line2")} label="Street (optional)" autoComplete="address-line2" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("area")} label="Area / Colony (optional)" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("landmark")} label="Landmark (optional)" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("city")} label="Village / Town / City" autoComplete="address-level2" required />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("district")} label="District (optional)" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("state_code")} label="State" select autoComplete="address-level1" required>
          {indianStates.map((state) => (
            <MenuItem key={state.code} value={state.code}>
              {state.name}
            </MenuItem>
          ))}
        </FormTextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormTextField control={control} name={n("postal_code")} label="PIN code" autoComplete="postal-code" required slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }} />
      </Grid>
      <Grid size={12}>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
          Address type
        </Typography>
        <Controller
          control={control}
          name={n("address_type")}
          render={({ field }) => (
            <ToggleButtonGroup exclusive size="small" color="primary" value={field.value} onChange={(_, v) => v && field.onChange(v)} aria-label="Address type">
              <ToggleButton value="home">Home</ToggleButton>
              <ToggleButton value="work">Work</ToggleButton>
              <ToggleButton value="other">Other</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
      </Grid>
    </Grid>
  );
}
