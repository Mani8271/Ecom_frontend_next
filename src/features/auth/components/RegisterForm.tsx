"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormTextField } from "@/components/forms/FormTextField";
import { PasswordField } from "@/components/forms/PasswordField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { routes } from "@/config/routes";
import { applyServerErrors } from "@/lib/forms";
import { useAuth } from "../AuthProvider";
import { registerSchema, type RegisterValues } from "../schemas";

const FIELDS = ["name", "email", "phone", "password", "password_confirmation"] as const;

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", password_confirmation: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register({ ...values, phone: values.phone || undefined, remember: true });
      router.replace(routes.verifyEmail);
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS));
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
      {formError && <Alert severity="error">{formError}</Alert>}
      <FormTextField control={control} name="name" label="Full name" autoComplete="name" autoFocus />
      <FormTextField control={control} name="email" label="Email" type="email" autoComplete="email" />
      <FormTextField control={control} name="phone" label="Mobile number (optional)" type="tel" autoComplete="tel-national" helperText="For order updates and quick OTP login" />
      <PasswordField control={control} name="password" label="Password" autoComplete="new-password" helperText="At least 8 characters with a letter and a number" />
      <PasswordField control={control} name="password_confirmation" label="Confirm password" autoComplete="new-password" />
      <SubmitButton pending={formState.isSubmitting} fullWidth>
        Create account
      </SubmitButton>
    </Stack>
  );
}
