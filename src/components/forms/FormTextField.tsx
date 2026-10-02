"use client";

import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, "name" | "value" | "onChange" | "error"> & {
  control: Control<T>;
  name: Path<T>;
};

/** TextField bound to react-hook-form, showing the field's validation message. */
export function FormTextField<T extends FieldValues>({ control, name, helperText, ...props }: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ""}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}
