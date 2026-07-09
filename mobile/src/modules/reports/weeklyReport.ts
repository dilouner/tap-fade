import type { Appointment } from '../appointments/types';

export type BarberWeeklyReport = {
  barberId: string;
  barberName: string;
  appointmentCount: number;
  occupiedMinutes: number;
  estimatedRevenue: number;
};

export type WeeklyOccupancyReport = {
  weekStart: Date;
  weekEnd: Date;
  appointmentCount: number;
  occupiedMinutes: number;
  estimatedRevenue: number;
  byBarber: BarberWeeklyReport[];
};

export function getWeekRange(reference = new Date()) {
  const weekStart = new Date(reference);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return { weekEnd, weekStart };
}

export function buildWeeklyOccupancyReport(appointments: Appointment[], reference = new Date()): WeeklyOccupancyReport {
  const { weekEnd, weekStart } = getWeekRange(reference);
  const reportable = appointments.filter(
    (appointment) =>
      ['confirmed', 'completed'].includes(appointment.status) &&
      appointment.startAt >= weekStart &&
      appointment.startAt < weekEnd,
  );

  const byBarberMap = new Map<string, BarberWeeklyReport>();

  for (const appointment of reportable) {
    const current = byBarberMap.get(appointment.barberId) ?? {
      appointmentCount: 0,
      barberId: appointment.barberId,
      barberName: appointment.barberName,
      estimatedRevenue: 0,
      occupiedMinutes: 0,
    };

    current.appointmentCount += 1;
    current.estimatedRevenue += appointment.priceSnapshot;
    current.occupiedMinutes += appointment.durationSnapshot;
    byBarberMap.set(appointment.barberId, current);
  }

  const byBarber = Array.from(byBarberMap.values()).sort((left, right) =>
    left.barberName.localeCompare(right.barberName),
  );

  return {
    appointmentCount: reportable.length,
    byBarber,
    estimatedRevenue: byBarber.reduce((total, barber) => total + barber.estimatedRevenue, 0),
    occupiedMinutes: byBarber.reduce((total, barber) => total + barber.occupiedMinutes, 0),
    weekEnd,
    weekStart,
  };
}
