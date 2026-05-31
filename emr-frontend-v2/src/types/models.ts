
export interface User {
  id: number;
  username: string;
  displayName?: string;
  roles?: string[];
}
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
  code?: number | string;
}
