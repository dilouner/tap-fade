export type UserRole = 'client' | 'barber' | 'owner' | 'admin';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
  avatarKey?: string | null;
  roles: UserRole[];
  ownerShopId?: string | null;
  barberShopId?: string | null;
  /** Legacy compatibility while existing Firestore documents are migrated. */
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type AppMode = UserRole;

export type AuthenticatedUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
};
