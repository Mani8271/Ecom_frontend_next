"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LinkButton } from "@/components/common/LinkButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageSkeleton } from "@/components/feedback/Skeletons";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/AuthProvider";

/**
 * Client-side gate for /admin. UX only: every admin endpoint checks
 * `admin.access` plus its own permission on the server.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { status, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") router.replace(routes.login(pathname));
  }, [status, router, pathname]);

  if (status !== "authenticated") return <PageSkeleton />;

  if (!hasPermission("admin.access")) {
    return (
      <EmptyState
        icon={<LockOutlinedIcon />}
        title="You don't have access to the admin panel"
        description="Sign in with a staff account, or ask an administrator for access."
        action={
          <LinkButton href={routes.home} variant="contained">
            Back to the store
          </LinkButton>
        }
      />
    );
  }

  return children;
}

/** Renders children only when the current user has the permission. */
export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : null;
}
