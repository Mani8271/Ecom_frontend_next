"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormTextField } from "@/components/forms/FormTextField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { applyServerErrors } from "@/lib/forms";
import { authService } from "@/services/auth/auth.service";
import type { AuthPayload } from "@/services/auth/types";
import { useAuth } from "../AuthProvider";
import { otpLoginSchema, type OtpLoginValues } from "../schemas";

/** Passwordless login: request a code to email/mobile, then verify it. */
export function OtpLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { startSession } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [message, setMessage] = useState<{ severity: "error" | "success"; text: string } | null>(null);
  const { control, handleSubmit, setError, getValues, formState } = useForm<OtpLoginValues>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: { identifier: "", code: "" },
  });

  async function sendCode(identifier: string) {
    const { message: text } = await authService.sendOtp("login", identifier);
    setSentTo(identifier);
    setMessage({ severity: "success", text: text ?? "Code sent." });
  }

  const onSubmit = handleSubmit(async ({ identifier, code }) => {
    setMessage(null);
    try {
      if (!sentTo) {
        await sendCode(identifier);
        return;
      }
      if (!code) {
        setError("code", { message: "Enter the 6-digit code" });
        return;
      }
      const { data } = await authService.verifyOtp<AuthPayload>("login", code, sentTo, true);
      startSession(data);
      onSuccess();
    } catch (error) {
      const text = applyServerErrors(error, setError, ["identifier", "code"]);
      if (text) setMessage({ severity: "error", text });
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
      {message && <Alert severity={message.severity}>{message.text}</Alert>}
      <FormTextField control={control} name="identifier" label="Email or mobile number" autoComplete="username" disabled={Boolean(sentTo)} />
      {sentTo && (
        <FormTextField
          control={control}
          name="code"
          label="6-digit code"
          autoComplete="one-time-code"
          autoFocus
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
        />
      )}
      <SubmitButton pending={formState.isSubmitting} fullWidth>
        {sentTo ? "Verify & login" : "Send code"}
      </SubmitButton>
      {sentTo && (
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Button size="small" onClick={() => setSentTo(null)}>
            Change
          </Button>
          <Button
            size="small"
            onClick={() =>
              sendCode(getValues("identifier")).catch((error) => setMessage({ severity: "error", text: applyServerErrors(error, setError, []) ?? "" }))
            }
          >
            Resend code
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
