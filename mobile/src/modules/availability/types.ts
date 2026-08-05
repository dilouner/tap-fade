export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AvailabilityBlock = {
  id: string;
  barberShopId: string;
  barberId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  blocked: boolean;
  kind: 'weekly' | 'exception';
  date: string | null;
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
  kind?: 'weekly' | 'exception';
  date?: string | null;
  reason?: string | null;
};
