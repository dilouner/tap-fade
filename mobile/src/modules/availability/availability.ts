import type { AvailabilityBlock, AvailabilityInput } from './types';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isQuarterHour(time: string) {
  return TIME_PATTERN.test(time) && timeToMinutes(time) % 15 === 0;
}

export function createAvailabilityBlock(
  input: AvailabilityInput,
  id = `availability-${Date.now()}`,
): AvailabilityBlock {
  const createdAt = new Date();

  return {
    barberId: input.barberId,
    barberShopId: input.barberShopId,
    blocked: input.blocked ?? false,
    createdAt,
    dayOfWeek: input.dayOfWeek,
    endTime: input.endTime,
    id,
    reason: input.reason?.trim() || null,
    startTime: input.startTime,
    updatedAt: createdAt,
  };
}

export function isValidAvailability(input: AvailabilityInput) {
  return (
    Boolean(input.barberShopId) &&
    Boolean(input.barberId) &&
    input.dayOfWeek >= 0 &&
    input.dayOfWeek <= 6 &&
    isQuarterHour(input.startTime) &&
    isQuarterHour(input.endTime) &&
    timeToMinutes(input.startTime) < timeToMinutes(input.endTime)
  );
}
