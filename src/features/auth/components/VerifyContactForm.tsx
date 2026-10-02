"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { applyServerErrors } from "@/lib/forms";
import { userMessage } from "@/services/api/errors";
import { authService } from "@/services/auth/auth.service";
import { useAuth } from "../AuthProvider";
import { otpCodeSchema, type OtpCodeValues } from "../schemas";

interface VerifyContactFormProps {
  channel: "email" | "phone";
  /** A code was already sent (e.g. right after registration). */
  codeAlreadySent?: boolean;
  onVerified?: () => void;
}

/** Verifies the signed-in user's email or mobile with a one-time code. */
export function VerifyContactForm({ channel, codeAlreadySent = false, onVerified }: VerifyContactFormProps) {
  const { user, setUser } = useAuth();
  const purpose = channel === "email" ? "verify_email" : "verify_phone";
  const target = channel === "email" ? user?.email : user?.phone;
  const [sent, setSent] = useState(codeAlreadySent);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const { control, handleSubmit, setError, formState, reset } = useForm<OtpCodeValues>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: "" },
  });

  async function send() {
    setSending(true);
    setNotice(null);
    try {
      const { message } = await authService.sendOtp(purpose);
      setSent(true);
      setNotice({ severity: "success", text: message ?? "Code sent." });
    } catch (error) {
      setNotice({ severity: "error", text: userMessage(error) });
    } finally {
      setSending(false);
    }
  }

  const onSubmit = handleSubmit(async ({ code }) => {
    setNotice(null);
    try {
      const { data } = await authService.verifyOtp(purpose, code);
      setUser(data);
      reset();
      onVerified?.();
    } catch (error) {
      const text = applyServerErrors(error, setError, ["code"]);
      if (text) setNotice({ severity: "error", text });
    }
  });

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {sent ? `Enter the 6-digit code we sent to ${target}.` : `We'll send a 6-digit code to ${target}.`}
      </Typography>
      {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
      {sent ? (
        <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
          <FormTextField control={control} name="code" label="6-digit code" autoComplete="one-time-code" autoFocus slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }} />
          <SubmitButton pending={formState.isSubmitting}>Verify</SubmitButton>
          <Button onClick={send} loading={sending} size="small" sx={{ alignSelf: "flex-start" }}>
            Resend code
          </Button>
        </Stack>
      ) : (
        <Button variant="contained" onClick={send} loading={sending} sx={{ alignSelf: "flex-start" }}>
          Send code
        </Button>
      )}
    </Stack>
  );
}
