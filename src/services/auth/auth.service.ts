import { http } from "@/services/api/http";
import type { AuthPayload, LoginInput, OtpPurpose, RegisterInput, User } from "./types";

export const authService = {
  login: (input: LoginInput) => http.post<AuthPayload>("/auth/login", input),

  register: (input: RegisterInput) => http.post<AuthPayload>("/auth/register", input),

  logout: () => http.post<null>("/auth/logout"),

  logoutAll: () => http.post<null>("/auth/logout-all"),

  me: () => http.get<User>("/auth/me"),

  forgotPassword: (email: string) => http.post<null>("/auth/forgot-password", { email }),

  resetPassword: (input: { token: string; email: string; password: string; password_confirmation: string }) =>
    http.post<null>("/auth/reset-password", input),

  sendOtp: (purpose: OtpPurpose, identifier?: string) => http.post<null>("/auth/otp/send", { purpose, identifier }),

  verifyOtp: <T = User>(purpose: OtpPurpose, code: string, identifier?: string, remember?: boolean) =>
    http.post<T>("/auth/otp/verify", { purpose, code, identifier, remember }),
};
