"use client";

import MuiLink, { type LinkProps as MuiLinkProps } from "@mui/material/Link";
import NextLink from "next/link";
import { forwardRef } from "react";

export type AppLinkProps = Omit<MuiLinkProps, "href"> & { href: string; prefetch?: boolean };

/** Theme-styled link with client-side navigation. */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink({ href, prefetch, ...props }, ref) {
  return <MuiLink ref={ref} component={NextLink} href={href} prefetch={prefetch} {...props} />;
});
