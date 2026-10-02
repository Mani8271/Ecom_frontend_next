"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import NextLink from "next/link";

/**
 * A Button that navigates. Lets Server Components render link-buttons
 * (they can't pass `component={NextLink}` across the client boundary).
 */
export function LinkButton({ href, ...props }: Omit<ButtonProps<"a">, "href" | "component"> & { href: string }) {
  return <Button component={NextLink} href={href} {...props} />;
}
