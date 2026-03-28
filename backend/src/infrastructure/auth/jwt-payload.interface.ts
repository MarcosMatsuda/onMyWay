export interface JwtPayload {
  sub: string; // parent id or user id
  email: string;
  schoolId?: string | null;
  role?: string; // 'parent' | 'school_admin' | 'super_admin'
}
