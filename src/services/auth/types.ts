/** Mirrors backend UserResource. */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  avatar: { thumb: string | null; sm: string | null } | null;
  roles: string[];
  permissions: string[];
  created_at: string;
}

export interface AuthPayload {
  user: User;
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
  remember?: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  remember?: boolean;
}

export type OtpPurpose = "verify_email" | "verify_phone" | "login";
