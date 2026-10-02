"use client";

import Button, { type ButtonProps } from "@mui/material/Button";

/** Primary submit button with a built-in pending state (MUI `loading`). */
export function SubmitButton({ pending, children, ...props }: ButtonProps & { pending?: boolean }) {
  return (
    <Button type="submit" variant="contained" size="large" loading={pending} {...props}>
      {children}
    </Button>
  );
}
