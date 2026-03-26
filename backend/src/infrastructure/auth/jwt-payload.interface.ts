export interface JwtPayload {
  sub: string; // parent id
  email: string;
  schoolId?: string | null;
}
