"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { useAuth } from "@/features/auth/AuthProvider";
import { applyServerErrors } from "@/lib/forms";
import { emailSchema, optionalMobileSchema } from "@/lib/validation";
import { accountService } from "@/services/account/account.service";
import type { User } from "@/services/auth/types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: emailSchema,
  phone: optionalMobileSchema,
});
type ProfileValues = z.infer<typeof profileSchema>;

/** Show numbers the way people type them: +919876543210 → 9876543210. */
const displayPhone = (phone: string | null) => (phone?.startsWith("+91") ? phone.slice(3) : (phone ?? ""));

function VerifiedChip({ verified }: { verified: boolean }) {
  return <Chip size="small" label={verified ? "Verified" : "Not verified"} color={verified ? "success" : "default"} variant="outlined" />;
}

export function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth();
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const { control, handleSubmit, setError, formState, reset } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email, phone: displayPhone(user.phone) },
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    try {
      const { data, message } = await accountService.updateProfile({ ...values, phone: values.phone || null });
      setUser(data);
      reset({ name: data.name, email: data.email, phone: displayPhone(data.phone) });
      setNotice({ severity: "success", text: message ?? "Profile updated." });
    } catch (error) {
      const text = applyServerErrors(error, setError, ["name", "email", "phone"]);
      if (text) setNotice({ severity: "error", text });
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate sx={{ maxWidth: 520 }}>
      {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
      <FormTextField control={control} name="name" label="Full name" autoComplete="name" />
      <FormTextField control={control} name="email" label="Email" type="email" autoComplete="email" helperText={<VerifiedChip verified={user.email_verified} />} />
      <FormTextField control={control} name="phone" label="Mobile number" type="tel" autoComplete="tel-national" helperText={user.phone ? <VerifiedChip verified={user.phone_verified} /> : undefined} />
      <SubmitButton pending={formState.isSubmitting} disabled={!formState.isDirty} sx={{ alignSelf: "flex-start" }}>
        Save changes
      </SubmitButton>
    </Stack>
  );
}
