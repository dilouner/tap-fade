import { createAppointment } from '../../appointments/appointmentRules';
import { buildWeeklyOccupancyReport } from '../weeklyReport';

describe('weekly occupancy report', () => {
  it('groups confirmed and completed appointments by barber', () => {
    const first = {
      ...createAppointment({
        barberId: 'barber-1',
        barberName: 'Daniel',
        barberShopId: 'shop-1',
        clientId: 'client-1',
        clientName: 'Cliente',
        durationSnapshot: 45,
        priceSnapshot: 250,
        serviceId: 'service-1',
        serviceName: 'Corte',
        startAt: new Date('2026-07-07T10:00:00.000Z'),
      }, 'appointment-1'),
      status: 'confirmed' as const,
    };
    const second = {
      ...first,
      id: 'appointment-2',
      durationSnapshot: 30,
      priceSnapshot: 150,
      status: 'completed' as const,
    };
    const rejected = {
      ...first,
      id: 'appointment-3',
      status: 'rejected' as const,
    };

    const report = buildWeeklyOccupancyReport([first, second, rejected], new Date('2026-07-09T12:00:00.000Z'));

    expect(report.appointmentCount).toBe(2);
    expect(report.estimatedRevenue).toBe(400);
    expect(report.occupiedMinutes).toBe(75);
    expect(report.byBarber[0]).toMatchObject({
      appointmentCount: 2,
      barberId: 'barber-1',
      estimatedRevenue: 400,
      occupiedMinutes: 75,
    });
  });
});
