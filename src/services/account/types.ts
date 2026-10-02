export type AddressType = "home" | "work" | "other";

export interface Address {
  id: number;
  label: string | null;
  address_type: AddressType;
  name: string;
  phone: string;
  /** House / flat / building */
  line1: string;
  /** Street */
  line2: string | null;
  area: string | null;
  landmark: string | null;
  /** Village / town / city */
  city: string;
  district: string | null;
  state: string;
  state_code: string | null;
  postal_code: string;
  country_code: string;
  is_default: boolean;
}

export type AddressInput = Omit<Address, "id" | "country_code" | "is_default"> & {
  country_code?: string;
  is_default?: boolean;
};

export interface ProfileInput {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}
