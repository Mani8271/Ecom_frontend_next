"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

/** Switch bound to a boolean react-hook-form field. */
export function FormSwitch<T extends FieldValues>({ control, name, label, helperText }: { control: Control<T>; name: Path<T>; label: string; helperText?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <FormControlLabel control={<Switch checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} onBlur={field.onBlur} />} label={label} />
          {helperText && <FormHelperText sx={{ mt: -0.5, ml: 6 }}>{helperText}</FormHelperText>}
        </div>
      )}
    />
  );
}
