import { z } from "zod";

/** Client-side rules mirror the API (the API remains the authority). */

export const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(191);

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

/** Indian mobile (10 digits, optional +91 / 0 prefix, spaces or dashes allowed). */
export const mobileSchema = z
  .string()
  .trim()
  .refine((value) => /^(?:\+?91|0)?[6-9]\d{9}$/.test(value.replace(/[\s-]/g, "")), "Enter a valid 10-digit mobile number");

export const optionalMobileSchema = z.union([z.literal(""), mobileSchema]);

export const pinCodeSchema = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

export const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

/** URL slug (optional in admin forms; the API generates one from the name). */
export const optionalSlugSchema = z
  .string()
  .trim()
  .max(191)
  .regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and hyphens only");

/** Numeric inputs stay strings in forms (converted on submit). "" is allowed when optional. */
export const intString = (message = "Enter a whole number") => z.string().trim().regex(/^-?\d*$/, message);
export const decimalString = (message = "Enter a valid amount") => z.string().trim().regex(/^(\d+(\.\d{1,2})?)?$/, message);
