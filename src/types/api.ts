/** Mirrors backend/app/Support/ApiResponse.php */

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface Paginated<T> extends ApiSuccess<T[]> {
  pagination: PaginationMeta;
}

export type FieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  success: false;
  message: string;
  code: string;
  errors?: FieldErrors;
  request_id?: string;
}

export interface PageQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}
