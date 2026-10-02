"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import NextLink from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/components/forms/PasswordField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { routes } from "@/config/routes";
import { applyServerErrors } from "@/lib/forms";
import { authService } from "@/services/auth/auth.service";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";

export function ResetPasswordForm({ token, email }: { token?: string; email?: string }) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  if (!token || !email) {
    return <Alert severity="error">This reset link is incomplete. Please request a new one.</Alert>;
  }

  if (done) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="success">Your password has been reset. Please log in with your new password.</Alert>
        <Button component={NextLink} href={routes.login()} variant="contained" size="large">
          Go to login
        </Button>
      </Stack>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authService.resetPassword({ token, email, ...values });
      setDone(true);
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ["password", "password_confirmation"]));
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
      {formError && <Alert severity="error">{formError}</Alert>}
      <PasswordField control={control} name="password" label="New password" autoComplete="new-password" autoFocus />
      <PasswordField control={control} name="password_confirmation" label="Confirm new password" autoComplete="new-password" />
      <SubmitButton pending={formState.isSubmitting} fullWidth>
        Reset password
      </SubmitButton>
    </Stack>
  );
}
