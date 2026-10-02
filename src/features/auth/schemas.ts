import { z } from "zod";
import { emailSchema, optionalMobileSchema, otpSchema, passwordSchema } from "@/lib/validation";

/** Email or Indian mobile number in one field. */
export const identifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your email or mobile number")
  .refine(
    (value) => (value.includes("@") ? emailSchema.safeParse(value).success : /^(?:\+?91|0)?[6-9]\d{9}$/.test(value.replace(/[\s-]/g, ""))),
    "Enter a valid email or 10-digit mobile number",
  );

export function toLoginIdentity(identifier: string): { email: string } | { phone: string } {
  const value = identifier.trim();
  return value.includes("@") ? { email: value } : { phone: value };
}

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const otpLoginSchema = z.object({
  identifier: identifierSchema,
  code: z.union([z.literal(""), otpSchema]),
});
export type OtpLoginValues = z.infer<typeof otpLoginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(120),
    email: emailSchema,
    phone: optionalMobileSchema,
    password: passwordSchema,
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: passwordSchema, password_confirmation: z.string() })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const otpCodeSchema = z.object({ code: otpSchema });
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
