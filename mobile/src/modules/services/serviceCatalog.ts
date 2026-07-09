import type { BarberService, BarberServiceInput } from './types';

const SLOT_MINUTES = 15;

export function createBarberService(input: BarberServiceInput, id = `service-${Date.now()}`): BarberService {
  const createdAt = new Date();

  return {
    active: true,
    barberShopId: input.barberShopId,
    createdAt,
    durationMinutes: input.durationMinutes,
    id,
    name: input.name.trim(),
    price: input.price,
    updatedAt: createdAt,
  };
}

export function isValidService(input: BarberServiceInput) {
  return (
    Boolean(input.barberShopId) &&
    input.name.trim().length >= 2 &&
    Number.isFinite(input.price) &&
    input.price >= 0 &&
    Number.isInteger(input.durationMinutes) &&
    input.durationMinutes >= SLOT_MINUTES &&
    input.durationMinutes % SLOT_MINUTES === 0
  );
}
