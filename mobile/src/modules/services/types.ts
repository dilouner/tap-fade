export type BarberService = {
  id: string;
  barberShopId: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BarberServiceInput = {
  barberShopId: string;
  name: string;
  price: number;
  durationMinutes: number;
};
