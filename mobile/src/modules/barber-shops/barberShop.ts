import type { Barber, BarberInput, BarberShop, BarberShopInput } from './types';

function now() {
  return new Date();
}

export function createBarberShop(input: BarberShopInput, id = `shop-${Date.now()}`): BarberShop {
  const createdAt = now();

  return {
    address: input.address.trim(),
    createdAt,
    description: input.description.trim(),
    id,
    name: input.name.trim(),
    ownerId: input.ownerId,
    photoUrl: input.photoUrl?.trim() || null,
    status: 'active',
    updatedAt: createdAt,
  };
}

export function createBarber(input: BarberInput, id = `barber-${Date.now()}`): Barber {
  const createdAt = now();

  return {
    active: true,
    barberShopId: input.barberShopId,
    createdAt,
    displayName: input.displayName.trim(),
    id,
    photoUrl: input.photoUrl?.trim() || null,
    specialties: input.specialties?.map((value) => value.trim()).filter(Boolean) ?? [],
    updatedAt: createdAt,
    userId: input.userId ?? null,
  };
}

export function isValidBarberShop(input: BarberShopInput) {
  return input.name.trim().length >= 2 && input.address.trim().length >= 4 && Boolean(input.ownerId);
}

export function isValidBarber(input: BarberInput) {
  return input.displayName.trim().length >= 2 && Boolean(input.barberShopId);
}
