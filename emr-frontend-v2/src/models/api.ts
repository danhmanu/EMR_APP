export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
}

export interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
}

export interface Role {
  id: number;
  name: string;
  isDeleted?: boolean;
}

export interface User {
  id: number;
  username?: string;
  displayName?: string;
  position?: string;
  employeeCode?: string;
  email?: string;
  roleId?: number | null;
  departmentId?: number | null;
  isDeleted: boolean;
  // optional related object if backend ever includes it
  role?: Role | null;
}
