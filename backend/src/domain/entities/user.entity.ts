export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'school_admin';
  schoolId: string | null;
  createdAt: Date;
}
