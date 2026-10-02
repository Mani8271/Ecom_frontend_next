"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import NextLink from "next/link";
import { FormSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { VerifyContactForm } from "@/features/auth/components/VerifyContactForm";

export function VerifyEmailPanel() {
  const { user } = useAuth();

  return (
    <RequireAuth fallback={<FormSkeleton fields={1} />}>
      <AuthCard title="Verify your email" subtitle="Verifying helps us keep your account secure and send order updates.">
        {user?.email_verified ? (
          <Stack spacing={2.5}>
            <Alert severity="success">Your email is verified.</Alert>
            <Button component={NextLink} href={routes.home} variant="contained" size="large">
              Start shopping
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <VerifyContactForm channel="email" codeAlreadySent />
            <Button component={NextLink} href={routes.home} size="small" sx={{ alignSelf: "flex-start" }}>
              Skip for now
            </Button>
          </Stack>
        )}
      </AuthCard>
    </RequireAuth>
  );
}
