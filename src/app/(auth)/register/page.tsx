import type { Metadata } from "next";
import { AppLink } from "@/components/common/AppLink";
import { routes } from "@/config/routes";
import { GuestOnly } from "@/features/auth/GuestOnly";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <GuestOnly next={routes.verifyEmail}>
      <AuthCard
        title="Create your account"
        subtitle="It takes less than a minute."
        footer={
          <>
            Already have an account? <AppLink href={routes.login()}>Login</AppLink>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </GuestOnly>
  );
}
