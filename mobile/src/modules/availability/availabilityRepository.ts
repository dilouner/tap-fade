import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { createAvailabilityBlock, isValidAvailability } from './availability';
import type { AvailabilityBlock, AvailabilityInput } from './types';

type AvailabilityRecord = Omit<AvailabilityBlock, 'createdAt' | 'updatedAt'> & {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

function normalizeAvailability(record: AvailabilityRecord): AvailabilityBlock {
  return {
    ...record,
    date: record.date ?? null,
    kind: record.kind ?? 'weekly',
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

export async function createBarberAvailability(
  input: AvailabilityInput,
  db: Firestore = getFirebaseDb(),
): Promise<AvailabilityBlock> {
  if (!isValidAvailability(input)) throw new Error('Usa horarios válidos en intervalos de 15 minutos.');
  const existing = await listShopAvailability(input.barberShopId, db);
  const overlaps = existing.some((block) => block.barberId === input.barberId
    && block.kind === (input.kind ?? 'weekly')
    && (block.kind === 'weekly' ? block.dayOfWeek === input.dayOfWeek : block.date === input.date)
    && block.blocked === (input.blocked ?? false)
    && input.startTime < block.endTime && block.startTime < input.endTime);
  if (overlaps) throw new Error('Este intervalo se cruza con otro ya configurado.');
  const availabilityRef = doc(collection(db, 'barberShops', input.barberShopId, 'availability'));
  const availability = createAvailabilityBlock(input, availabilityRef.id);
  await setDoc(availabilityRef, availability);
  return availability;
}

export async function updateBarberAvailability(block: AvailabilityBlock, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'barberShops', block.barberShopId, 'availability', block.id), {
    blocked: block.blocked,
    date: block.date,
    dayOfWeek: block.dayOfWeek,
    endTime: block.endTime,
    kind: block.kind,
    reason: block.reason,
    startTime: block.startTime,
    updatedAt: new Date(),
  });
}

export async function listShopAvailability(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<AvailabilityBlock[]> {
  const snapshot = await getDocs(collection(db, 'barberShops', barberShopId, 'availability'));
  return snapshot.docs.map((item) => normalizeAvailability(item.data() as AvailabilityRecord));
}

export async function deleteBarberAvailability(block: AvailabilityBlock, db: Firestore = getFirebaseDb()) {
  await deleteDoc(doc(db, 'barberShops', block.barberShopId, 'availability', block.id));
}
