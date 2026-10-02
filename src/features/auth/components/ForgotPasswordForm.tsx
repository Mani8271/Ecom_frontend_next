"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { applyServerErrors } from "@/lib/forms";
import { authService } from "@/services/auth/auth.service";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";

export function ForgotPasswordForm() {
  const [result, setResult] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setResult(null);
    try {
      const { message } = await authService.forgotPassword(email);
      setResult({ severity: "success", text: message ?? "Check your inbox for a reset link." });
    } catch (error) {
      const text = applyServerErrors(error, setError, ["email"]);
      if (text) setResult({ severity: "error", text });
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
      {result && <Alert severity={result.severity}>{result.text}</Alert>}
      <FormTextField control={control} name="email" label="Email" type="email" autoComplete="email" autoFocus />
      <SubmitButton pending={formState.isSubmitting} fullWidth>
        Send reset link
      </SubmitButton>
    </Stack>
  );
}
