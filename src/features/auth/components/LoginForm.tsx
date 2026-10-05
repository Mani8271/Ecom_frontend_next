"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppLink } from "@/components/common/AppLink";
import { FormTextField } from "@/components/forms/FormTextField";
import { PasswordField } from "@/components/forms/PasswordField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { routes, safeRedirectPath } from "@/config/routes";
import { applyServerErrors } from "@/lib/forms";
import { useAuth } from "../AuthProvider";
import { loginSchema, toLoginIdentity, type LoginValues } from "../schemas";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { OtpLoginForm } from "./OtpLoginForm";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const router = useRouter();
  const redirectTo = safeRedirectPath(next);

  return (
    <>
      <GoogleLoginButton onSuccess={() => router.replace(redirectTo)} />
      <Tabs value={mode} onChange={(_, value) => setMode(value)} variant="fullWidth" sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="password" label="Password" />
        <Tab value="otp" label="One-time code" />
      </Tabs>
      {mode === "password" ? <PasswordLogin onSuccess={() => router.replace(redirectTo)} /> : <OtpLoginForm onSuccess={() => router.replace(redirectTo)} />}
    </>
  );
}

function PasswordLogin({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: true },
  });

  const onSubmit = handleSubmit(async ({ identifier, password, remember }) => {
    setFormError(null);
    try {
      await login({ ...toLoginIdentity(identifier), password, remember });
      onSuccess();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ["password"]));
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
      {formError && <Alert severity="error">{formError}</Alert>}
      <FormTextField control={control} name="identifier" label="Email or mobile number" autoComplete="username" autoFocus />
      <PasswordField control={control} name="password" label="Password" autoComplete="current-password" />
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Controller
          control={control}
          name="remember"
          render={({ field }) => <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Keep me signed in" />}
        />
        <AppLink href={routes.forgotPassword} variant="body2">
          Forgot password?
        </AppLink>
      </Stack>
      <SubmitButton pending={formState.isSubmitting} fullWidth>
        Login
      </SubmitButton>
    </Stack>
  );
}
