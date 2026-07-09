export type UserRole = 'client' | 'barber' | 'owner' | 'admin';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
};
