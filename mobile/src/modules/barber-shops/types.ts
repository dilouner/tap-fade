export type BarberShopStatus = 'active' | 'inactive';

export type BarberShop = {
  id: string;
  name: string;
  description: string;
  address: string;
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
  specialties: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BarberShopInput = {
  name: string;
  description: string;
  address: string;
  ownerId: string;
};

export type BarberInput = {
  barberShopId: string;
  displayName: string;
  specialties?: string[];
  userId?: string | null;
};
