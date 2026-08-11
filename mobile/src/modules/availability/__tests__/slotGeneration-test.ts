import { getAvailableSlots } from '../slotGeneration';
import type { AvailabilityBlock } from '../types';

function block(overrides: Partial<AvailabilityBlock> = {}): AvailabilityBlock {
  return {
    barberId: 'barber-1',
    barberShopId: 'shop-1',
    blocked: false,
    createdAt: new Date(0),
    date: null,
    dayOfWeek: 1,
    endTime: '11:00',
    id: 'availability-1',
    kind: 'weekly',
    reason: '',
    startTime: '09:00',
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe('getAvailableSlots', () => {
  const monday = new Date(2030, 0, 7, 12);
  const now = new Date(2030, 0, 1, 12);

  it('deduplicates slots produced by overlapping intervals', () => {
    const slots = getAvailableSlots({
      availability: [block(), block({ id: 'availability-2', startTime: '09:30', endTime: '10:30' })],
      barberId: 'barber-1',
      date: monday,
      durationMinutes: 30,
      now,
    });

    expect(new Set(slots.map((slot) => slot.getTime())).size).toBe(slots.length);
    expect(slots).toHaveLength(7);
  });

  it('opens extraordinary time through an available dated exception', () => {
    const slots = getAvailableSlots({
      availability: [block({ date: '2030-01-07', endTime: '14:00', kind: 'exception', startTime: '13:00' })],
      barberId: 'barber-1',
      date: monday,
      durationMinutes: 30,
      now,
    });

    expect(slots).toHaveLength(3);
  });

  it('removes slots intersecting a dated block', () => {
    const slots = getAvailableSlots({
      availability: [block(), block({ blocked: true, date: '2030-01-07', endTime: '10:00', id: 'block-1', kind: 'exception', startTime: '09:30' })],
      barberId: 'barber-1',
      date: monday,
      durationMinutes: 30,
      now,
    });

    expect(slots).toHaveLength(4);
  });
});
