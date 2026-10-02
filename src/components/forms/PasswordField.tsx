"use client";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { FormTextField } from "./FormTextField";

type PasswordFieldProps<T extends FieldValues> = React.ComponentProps<typeof FormTextField<T>>;

export function PasswordField<T extends FieldValues>(props: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormTextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((v) => !v)} edge="end">
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
