"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PasswordField } from "@/components/forms/PasswordField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { VerifyContactForm } from "@/features/auth/components/VerifyContactForm";
import { applyServerErrors } from "@/lib/forms";
import { passwordSchema } from "@/lib/validation";
import { accountService } from "@/services/account/account.service";
import { tokenStore } from "@/services/api/token-store";

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Passwords do not match" });
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          {description}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function ChangePasswordForm() {
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const { control, handleSubmit, setError, formState, reset } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    try {
      const { data, message } = await accountService.changePassword(values);
      tokenStore.set(data.access_token); // old access tokens were invalidated
      reset();
      setNotice({ severity: "success", text: message ?? "Password changed." });
    } catch (error) {
      const text = applyServerErrors(error, setError, ["current_password", "password", "password_confirmation"]);
      if (text) setNotice({ severity: "error", text });
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate sx={{ maxWidth: 480 }}>
      {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
      <PasswordField control={control} name="current_password" label="Current password" autoComplete="current-password" />
      <PasswordField control={control} name="password" label="New password" autoComplete="new-password" />
      <PasswordField control={control} name="password_confirmation" label="Confirm new password" autoComplete="new-password" />
      <SubmitButton pending={formState.isSubmitting} sx={{ alignSelf: "flex-start" }}>
        Update password
      </SubmitButton>
    </Stack>
  );
}

export function SecurityPanel() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function logoutEverywhere() {
    setSigningOut(true);
    await logout(true);
    router.replace(routes.login());
  }

  return (
    <Stack spacing={3}>
      <Section title="Change password" description="Other devices will be signed out automatically.">
        <ChangePasswordForm />
      </Section>

      {user && !user.email_verified && (
        <Section title="Verify your email" description="Get order updates and recover your account easily.">
          <VerifyContactForm channel="email" />
        </Section>
      )}

      {user?.phone && !user.phone_verified && (
        <Section title="Verify your mobile number" description="Enables quick login with a one-time code.">
          <VerifyContactForm channel="phone" />
        </Section>
      )}

      <Section title="Sign out everywhere" description="Signs you out on every phone, tablet and computer, including this one.">
        <Button variant="outlined" color="error" onClick={logoutEverywhere} loading={signingOut}>
          Sign out of all devices
        </Button>
      </Section>
    </Stack>
  );
}
