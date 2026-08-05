import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  startAt as queryStartAt,
  endAt as queryEndAt,
  setDoc,
  updateDoc,
  writeBatch,
  where,
  type Firestore,
} from 'firebase/firestore';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { promoteUserToOwner } from '../users/userProfileRepository';
import type { UserProfile, UserRole } from '../users/types';
import { createBarberService } from '../services/serviceCatalog';
import { createAvailabilityBlock } from '../availability/availability';
import type { DayOfWeek } from '../availability/types';
import { createBarber, createBarberShop } from './barberShop';
import type { Barber, BarberInput, BarberShop, BarberShopInput } from './types';

type BarberShopRecord = Omit<BarberShop, 'createdAt' | 'updatedAt'> & {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

type BarberRecord = Omit<Barber, 'createdAt' | 'updatedAt'> & {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

function normalizeBarberShop(record: BarberShopRecord): BarberShop {
  return {
    ...record,
    location: record.location ?? null,
    status: record.status === 'inactive' ? 'paused' : record.status,
    timezone: record.timezone ?? 'America/Chihuahua',
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

function normalizeBarber(record: BarberRecord): Barber {
  return {
    ...record,
    serviceIds: record.serviceIds ?? [],
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

export async function createOwnedBarberShop(input: BarberShopInput, db: Firestore = getFirebaseDb()): Promise<BarberShop> {
  const shopRef = doc(collection(db, 'barberShops'));
  const shop = createBarberShop(input, shopRef.id);
  await setDoc(shopRef, shop);
  await setDoc(doc(db, 'barberShops', shop.id, 'members', input.ownerId), {
    active: true,
    barberId: null,
    barberShopId: shop.id,
    createdAt: new Date(),
    role: 'owner',
    uid: input.ownerId,
    updatedAt: new Date(),
  });
  await promoteUserToOwner(input.ownerId, shop.id, db);
  return shop;
}

export async function createBusinessOnboarding(input: {
  shop: BarberShopInput;
  ownerProfile: UserProfile;
  serviceName: string;
  servicePrice: number;
  barberName: string;
  ownerWorksHere: boolean;
  startTime: string;
  endTime: string;
}, db: Firestore = getFirebaseDb()): Promise<BarberShop> {
  const shopRef = doc(collection(db, 'barberShops'));
  const serviceRef = doc(collection(db, 'barberShops', shopRef.id, 'services'));
  const barberRef = doc(collection(db, 'barberShops', shopRef.id, 'barbers'));
  const shop = createBarberShop(input.shop, shopRef.id);
  const service = createBarberService({ barberShopId: shop.id, durationMinutes: 45, name: input.serviceName, price: input.servicePrice }, serviceRef.id);
  const barber = createBarber({ barberShopId: shop.id, displayName: input.barberName, serviceIds: [service.id], userId: input.ownerWorksHere ? input.ownerProfile.uid : null }, barberRef.id);
  const batch = writeBatch(db);
  batch.set(shopRef, shop);
  batch.set(serviceRef, service);
  batch.set(barberRef, barber);
  batch.set(doc(db, 'barberShops', shop.id, 'members', input.ownerProfile.uid), {
    active: true, barberId: input.ownerWorksHere ? barber.id : null, barberShopId: shop.id,
    createdAt: new Date(), role: 'owner', uid: input.ownerProfile.uid, updatedAt: new Date(),
  });
  for (const day of [1, 2, 3, 4, 5, 6] as DayOfWeek[]) {
    const availabilityRef = doc(collection(db, 'barberShops', shop.id, 'availability'));
    batch.set(availabilityRef, createAvailabilityBlock({ barberId: barber.id, barberShopId: shop.id, dayOfWeek: day, endTime: input.endTime, kind: 'weekly', startTime: input.startTime }, availabilityRef.id));
  }
  const roles = Array.from(new Set<UserRole>(['client', ...input.ownerProfile.roles, 'owner', ...(input.ownerWorksHere ? ['barber' as const] : [])]));
  batch.update(doc(db, 'users', input.ownerProfile.uid), {
    ...(input.ownerWorksHere ? { barberShopId: shop.id } : {}), ownerShopId: shop.id,
    role: 'owner', roles, updatedAt: new Date(),
  });
  await batch.commit();
  return shop;
}

export type NearbyShop = BarberShop & { distanceKm: number | null };

export async function listNearbyActiveBarberShops(
  center: [number, number],
  radiusKm = 35,
  db: Firestore = getFirebaseDb(),
): Promise<NearbyShop[]> {
  const bounds = geohashQueryBounds(center, radiusKm * 1000);
  const snapshots = await Promise.all(bounds.map(([start, end]) => getDocs(query(
    collection(db, 'barberShops'),
    where('status', '==', 'active'),
    orderBy('location.geohash'),
    queryStartAt(start),
    queryEndAt(end),
  ))));
  const unique = new Map<string, NearbyShop>();
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((item) => {
    const shop = normalizeBarberShop(item.data() as BarberShopRecord);
    if (!shop.location) return;
    const distanceKm = distanceBetween(center, [shop.location.latitude, shop.location.longitude]);
    if (distanceKm <= radiusKm) unique.set(shop.id, { ...shop, distanceKm });
  });
  return [...unique.values()].sort((left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity));
}

export async function updateBarberShop(shop: BarberShop, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'barberShops', shop.id), {
    address: shop.address.trim(),
    description: shop.description.trim(),
    name: shop.name.trim(),
    photoUrl: shop.photoUrl?.trim() || null,
    location: shop.location,
    timezone: shop.timezone,
    updatedAt: new Date(),
  });
}

export async function updateBarberShopStatus(
  barberShopId: string,
  status: BarberShop['status'],
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  await updateDoc(doc(db, 'barberShops', barberShopId), {
    status,
    updatedAt: new Date(),
  });
}

export async function listAllBarberShops(db: Firestore = getFirebaseDb()): Promise<BarberShop[]> {
  const snapshot = await getDocs(collection(db, 'barberShops'));
  return snapshot.docs.map((item) => normalizeBarberShop(item.data() as BarberShopRecord));
}

export async function listActiveBarberShops(db: Firestore = getFirebaseDb()): Promise<BarberShop[]> {
  const snapshot = await getDocs(query(collection(db, 'barberShops'), where('status', '==', 'active')));
  return snapshot.docs.map((item) => normalizeBarberShop(item.data() as BarberShopRecord));
}

export async function getOwnerBarberShop(ownerId: string, db: Firestore = getFirebaseDb()): Promise<BarberShop | null> {
  const snapshot = await getDocs(query(collection(db, 'barberShops'), where('ownerId', '==', ownerId), limit(1)));
  const first = snapshot.docs[0];
  return first ? normalizeBarberShop(first.data() as BarberShopRecord) : null;
}

export async function getBarberShopById(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<BarberShop | null> {
  const snapshot = await getDoc(doc(db, 'barberShops', barberShopId));
  return snapshot.exists() ? normalizeBarberShop(snapshot.data() as BarberShopRecord) : null;
}

export async function createShopBarber(input: BarberInput, db: Firestore = getFirebaseDb()): Promise<Barber> {
  const barberRef = doc(collection(db, 'barberShops', input.barberShopId, 'barbers'));
  const barber = createBarber(input, barberRef.id);
  await setDoc(barberRef, barber);
  return barber;
}

export async function updateShopBarber(barber: Barber, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'barberShops', barber.barberShopId, 'barbers', barber.id), {
    active: barber.active,
    displayName: barber.displayName.trim(),
    photoUrl: barber.photoUrl?.trim() || null,
    serviceIds: barber.serviceIds,
    specialties: barber.specialties,
    updatedAt: new Date(),
    userId: barber.userId,
  });
}

export async function assignUserToBarber(
  barberShopId: string,
  barberId: string,
  userId: string | null,
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  await updateDoc(doc(db, 'barberShops', barberShopId, 'barbers', barberId), {
    updatedAt: new Date(),
    userId: userId?.trim() || null,
  });
}

export async function listShopBarbers(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<Barber[]> {
  const snapshot = await getDocs(collection(db, 'barberShops', barberShopId, 'barbers'));
  return snapshot.docs.map((item) => normalizeBarber(item.data() as BarberRecord));
}
