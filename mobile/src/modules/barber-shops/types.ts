export type BarberShopStatus = 'active' | 'paused' | 'suspended' | 'inactive';

export type ShopLocation = {
  latitude: number;
  longitude: number;
  geohash: string;
};

export type BarberShop = {
  id: string;
  name: string;
  description: string;
  address: string;
  photoUrl: string | null;
  coverKey: string | null;
  location: ShopLocation | null;
  timezone: string;
  ownerId: string;
  status: BarberShopStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Barber = {
  id: string;
  barberShopId: string;
  userId: string | null;
  displayName: string;
  photoUrl: string | null;
  avatarKey: string | null;
  specialties: string[];
  serviceIds: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BarberShopInput = {
  name: string;
  description: string;
  address: string;
  photoUrl?: string | null;
  coverKey?: string | null;
  location?: ShopLocation | null;
  timezone?: string;
  ownerId: string;
};

export type BarberInput = {
  barberShopId: string;
  displayName: string;
  photoUrl?: string | null;
  avatarKey?: string | null;
  specialties?: string[];
  serviceIds?: string[];
  userId?: string | null;
};

export type ShopMemberRole = 'owner' | 'barber';

export type ShopMember = {
  uid: string;
  barberShopId: string;
  barberId: string | null;
  role: ShopMemberRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  inviteId?: string | null;
};

export type BarberInvite = {
  id: string;
  codeHash: string;
  codePreview: string;
  barberShopId: string;
  barberId: string;
  createdBy: string;
  acceptedBy: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};
