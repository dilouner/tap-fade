import type { Appointment, AppointmentInput, AppointmentStatus } from './types';

const ACTIVE_STATUSES: AppointmentStatus[] = ['pending', 'confirmed'];

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function createAppointment(input: AppointmentInput, id = `appointment-${Date.now()}`): Appointment {
  const createdAt = new Date();

  return {
    ...input,
    createdAt,
    endAt: addMinutes(input.startAt, input.durationSnapshot),
    id,
    rescheduleRequest: null,
    revision: 1,
    slotIds: [],
    status: 'pending',
    updatedAt: createdAt,
  };
}

export function appointmentsOverlap(left: Pick<Appointment, 'startAt' | 'endAt'>, right: Pick<Appointment, 'startAt' | 'endAt'>) {
  return left.startAt < right.endAt && right.startAt < left.endAt;
}

export function hasActiveConflict(candidate: Appointment, appointments: Appointment[]) {
  return appointments.some(
    (appointment) =>
      appointment.id !== candidate.id &&
      appointment.barberId === candidate.barberId &&
      ACTIVE_STATUSES.includes(appointment.status) &&
      appointmentsOverlap(candidate, appointment),
  );
}

export function canEditAppointment(appointment: Pick<Appointment, 'status' | 'startAt'>, now = new Date()) {
  const oneHourFromNow = addMinutes(now, 60);
  return !['cancelled', 'completed'].includes(appointment.status) && appointment.startAt >= oneHourFromNow;
}

export function canTransitionAppointment(current: AppointmentStatus, next: AppointmentStatus) {
  const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    cancelled: [],
    completed: [],
    confirmed: ['cancelled', 'completed'],
    pending: ['confirmed', 'rejected', 'cancelled'],
    rejected: [],
  };

  return transitions[current].includes(next);
}

export function isQuarterHourDate(value: Date) {
  return value.getSeconds() === 0 && value.getMilliseconds() === 0 && value.getMinutes() % 15 === 0;
}

export function assertAppointmentWindow(startAt: Date, now = new Date()) {
  if (!isQuarterHourDate(startAt)) throw new Error('El horario debe iniciar en un intervalo de 15 minutos.');
  if (startAt < addMinutes(now, 60) || startAt > addMinutes(now, 60 * 24 * 60)) {
    throw new Error('Reserva entre una hora y 60 días de anticipación.');
  }
}
