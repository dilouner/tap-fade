export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AvailabilityBlock = {
  id: string;
  barberShopId: string;
  barberId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  blocked: boolean;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AvailabilityInput = {
  barberShopId: string;
  barberId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  blocked?: boolean;
  reason?: string | null;
};
