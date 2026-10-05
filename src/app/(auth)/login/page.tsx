import type { Metadata } from "next";
import { AppLink } from "@/components/common/AppLink";
import { routes } from "@/config/routes";
import { GuestOnly } from "@/features/auth/GuestOnly";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <GuestOnly next={nextPath}>
      <AuthCard
        title="Welcome back"
        subtitle="Login to track orders, save addresses and check out faster."
        footer={
          <>
            New to Loomi Trends? <AppLink href={routes.register}>Create an account</AppLink>
          </>
        }
      >
        <LoginForm next={nextPath} />
      </AuthCard>
    </GuestOnly>
  );
}
