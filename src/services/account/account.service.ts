import { http } from "@/services/api/http";
import type { User } from "@/services/auth/types";
import type { OrderSummaryRow } from "@/services/orders/types";
import type { PageQuery } from "@/types/api";
import type { Address, AddressInput, ChangePasswordInput, ProfileInput } from "./types";

export interface AccountDashboard {
  profile: User;
  recent_orders: OrderSummaryRow[];
  counts: { orders: number; active_orders: number; wishlist: number; addresses: number; reviews: number };
  default_address: Address | null;
}

export const accountService = {
  dashboard: () => http.get<AccountDashboard>("/account/dashboard").then((r) => r.data),

  profile: () => http.get<User>("/account/profile"),

  updateProfile: (input: ProfileInput) => http.patch<User>("/account/profile", input),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return http.post<User>("/account/profile/avatar", form);
  },

  deleteAvatar: () => http.delete<User>("/account/profile/avatar"),

  changePassword: (input: ChangePasswordInput) =>
    http.put<{ access_token: string; expires_in: number }>("/account/password", input),

  addresses: (query: PageQuery = {}) => http.paginated<Address>("/account/addresses", { query: { ...query } }),

  createAddress: (input: AddressInput) => http.post<Address>("/account/addresses", input),

  updateAddress: (id: number, input: Partial<AddressInput>) => http.patch<Address>(`/account/addresses/${id}`, input),

  deleteAddress: (id: number) => http.delete(`/account/addresses/${id}`),

  setDefaultAddress: (id: number) => http.post<Address>(`/account/addresses/${id}/default`),
};
