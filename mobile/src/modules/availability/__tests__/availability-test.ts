import { createAvailabilityBlock, isQuarterHour, isValidAvailability, timeToMinutes } from '../availability';

describe('availability domain', () => {
  it('validates 15 minute time slots', () => {
    expect(timeToMinutes('09:15')).toBe(555);
    expect(isQuarterHour('09:15')).toBe(true);
    expect(isQuarterHour('09:10')).toBe(false);
  });

  it('creates a valid barber schedule block', () => {
    const block = createAvailabilityBlock({
      barberId: 'barber-1',
      barberShopId: 'shop-1',
      dayOfWeek: 1,
      endTime: '18:00',
      startTime: '09:00',
    }, 'availability-1');

    expect(block).toMatchObject({
      blocked: false,
      dayOfWeek: 1,
      endTime: '18:00',
      startTime: '09:00',
    });
    expect(isValidAvailability(block)).toBe(true);
  });
});
