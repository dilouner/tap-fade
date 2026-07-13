import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { promoteUserToOwner } from '../users/userProfileRepository';
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
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

function normalizeBarber(record: BarberRecord): Barber {
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

export async function createOwnedBarberShop(input: BarberShopInput, db: Firestore = getFirebaseDb()): Promise<BarberShop> {
  const shopRef = doc(collection(db, 'barberShops'));
  const shop = createBarberShop(input, shopRef.id);
  await setDoc(shopRef, shop);
  await promoteUserToOwner(input.ownerId, db);
  return shop;
}

export async function updateBarberShop(shop: BarberShop, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'barberShops', shop.id), {
    address: shop.address.trim(),
    description: shop.description.trim(),
    name: shop.name.trim(),
    photoUrl: shop.photoUrl?.trim() || null,
    updatedAt: new Date(),
  });
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
    specialties: barber.specialties,
    updatedAt: new Date(),
    userId: barber.userId,
  });
}

export async function listShopBarbers(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<Barber[]> {
  const snapshot = await getDocs(collection(db, 'barberShops', barberShopId, 'barbers'));
  return snapshot.docs.map((item) => normalizeBarber(item.data() as BarberRecord));
}
