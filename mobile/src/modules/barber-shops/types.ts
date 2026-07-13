export type BarberShopStatus = 'active' | 'inactive';

export type BarberShop = {
  id: string;
  name: string;
  description: string;
  address: string;
  photoUrl: string | null;
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
  specialties: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BarberShopInput = {
  name: string;
  description: string;
  address: string;
  photoUrl?: string | null;
  ownerId: string;
};

export type BarberInput = {
  barberShopId: string;
  displayName: string;
  photoUrl?: string | null;
  specialties?: string[];
  userId?: string | null;
};
