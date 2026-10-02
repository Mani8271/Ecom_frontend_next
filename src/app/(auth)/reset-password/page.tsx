import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  // The URL contains a one-time token: never leak it through the Referer header.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token, email } = await searchParams;

  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm token={typeof token === "string" ? token : undefined} email={typeof email === "string" ? email : undefined} />
    </AuthCard>
  );
}
