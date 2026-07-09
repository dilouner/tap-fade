import {
  addMinutes,
  appointmentsOverlap,
  canEditAppointment,
  canTransitionAppointment,
  createAppointment,
  hasActiveConflict,
} from '../appointmentRules';

const baseInput = {
  barberId: 'barber-1',
  barberName: 'Daniel',
  barberShopId: 'shop-1',
  clientId: 'client-1',
  clientName: 'Cliente',
  durationSnapshot: 45,
  priceSnapshot: 250,
  serviceId: 'service-1',
  serviceName: 'Corte',
  startAt: new Date('2026-07-10T10:00:00.000Z'),
};

describe('appointment rules', () => {
  it('calculates endAt from service duration', () => {
    const appointment = createAppointment(baseInput, 'appointment-1');

    expect(appointment.endAt).toEqual(new Date('2026-07-10T10:45:00.000Z'));
    expect(appointment.status).toBe('pending');
  });

  it('detects active appointment conflicts for the same barber', () => {
    const existing = createAppointment(baseInput, 'appointment-1');
    const candidate = createAppointment({
      ...baseInput,
      startAt: new Date('2026-07-10T10:30:00.000Z'),
    }, 'appointment-2');

    expect(appointmentsOverlap(existing, candidate)).toBe(true);
    expect(hasActiveConflict(candidate, [existing])).toBe(true);
  });

  it('allows edits only before the one hour window and valid state transitions', () => {
    const appointment = createAppointment(baseInput, 'appointment-1');

    expect(canEditAppointment(appointment, addMinutes(appointment.startAt, -90))).toBe(true);
    expect(canEditAppointment(appointment, addMinutes(appointment.startAt, -30))).toBe(false);
    expect(canTransitionAppointment('pending', 'confirmed')).toBe(true);
    expect(canTransitionAppointment('completed', 'confirmed')).toBe(false);
  });
});
