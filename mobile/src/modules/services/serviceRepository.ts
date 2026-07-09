import { collection, doc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { createBarberService } from './serviceCatalog';
import type { BarberService, BarberServiceInput } from './types';

type BarberServiceRecord = Omit<BarberService, 'createdAt' | 'updatedAt'> & {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

function normalizeService(record: BarberServiceRecord): BarberService {
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

export async function createShopService(input: BarberServiceInput, db: Firestore = getFirebaseDb()): Promise<BarberService> {
  const serviceRef = doc(collection(db, 'barberShops', input.barberShopId, 'services'));
  const service = createBarberService(input, serviceRef.id);
  await setDoc(serviceRef, service);
  return service;
}

export async function updateShopService(service: BarberService, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'barberShops', service.barberShopId, 'services', service.id), {
    active: service.active,
    durationMinutes: service.durationMinutes,
    name: service.name.trim(),
    price: service.price,
    updatedAt: new Date(),
  });
}

export async function listShopServices(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<BarberService[]> {
  const snapshot = await getDocs(collection(db, 'barberShops', barberShopId, 'services'));
  return snapshot.docs.map((item) => normalizeService(item.data() as BarberServiceRecord));
}
