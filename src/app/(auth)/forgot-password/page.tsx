import type { Metadata } from "next";
import { AppLink } from "@/components/common/AppLink";
import { routes } from "@/config/routes";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={<AppLink href={routes.login()}>Back to login</AppLink>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
