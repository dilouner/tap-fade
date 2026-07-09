export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export type Appointment = {
  id: string;
  clientId: string;
  clientName: string;
  barberShopId: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  priceSnapshot: number;
  durationSnapshot: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AppointmentInput = {
  clientId: string;
  clientName: string;
  barberShopId: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  startAt: Date;
  priceSnapshot: number;
  durationSnapshot: number;
};
