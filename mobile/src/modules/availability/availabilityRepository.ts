import { collection, doc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { createAvailabilityBlock } from './availability';
import type { AvailabilityBlock, AvailabilityInput } from './types';

type AvailabilityRecord = Omit<AvailabilityBlock, 'createdAt' | 'updatedAt'> & {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

function normalizeAvailability(record: AvailabilityRecord): AvailabilityBlock {
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

export async function createBarberAvailability(
  input: AvailabilityInput,
  db: Firestore = getFirebaseDb(),
): Promise<AvailabilityBlock> {
  const availabilityRef = doc(collection(db, 'barberShops', input.barberShopId, 'availability'));
  const availability = createAvailabilityBlock(input, availabilityRef.id);
  await setDoc(availabilityRef, availability);
  return availability;
}

export async function updateBarberAvailability(block: AvailabilityBlock, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'barberShops', block.barberShopId, 'availability', block.id), {
    blocked: block.blocked,
    dayOfWeek: block.dayOfWeek,
    endTime: block.endTime,
    reason: block.reason,
    startTime: block.startTime,
    updatedAt: new Date(),
  });
}

export async function listShopAvailability(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<AvailabilityBlock[]> {
  const snapshot = await getDocs(collection(db, 'barberShops', barberShopId, 'availability'));
  return snapshot.docs.map((item) => normalizeAvailability(item.data() as AvailabilityRecord));
}
