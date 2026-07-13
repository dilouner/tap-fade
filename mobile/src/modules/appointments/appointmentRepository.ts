import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { createAppointment, hasActiveConflict } from './appointmentRules';
import type { Appointment, AppointmentInput, AppointmentStatus } from './types';

type AppointmentRecord = Omit<Appointment, 'createdAt' | 'updatedAt' | 'startAt' | 'endAt'> & {
  createdAt: FirestoreDate;
  endAt: FirestoreDate;
  startAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

function normalizeAppointment(record: AppointmentRecord): Appointment {
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    endAt: normalizeFirestoreDate(record.endAt),
    startAt: normalizeFirestoreDate(record.startAt),
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

export async function listShopAppointments(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<Appointment[]> {
  const snapshot = await getDocs(query(collection(db, 'appointments'), where('barberShopId', '==', barberShopId)));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export async function listClientAppointments(clientId: string, db: Firestore = getFirebaseDb()): Promise<Appointment[]> {
  const snapshot = await getDocs(query(collection(db, 'appointments'), where('clientId', '==', clientId)));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export async function listAllAppointments(db: Firestore = getFirebaseDb()): Promise<Appointment[]> {
  const snapshot = await getDocs(collection(db, 'appointments'));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export async function createClientAppointment(input: AppointmentInput, db: Firestore = getFirebaseDb()): Promise<Appointment> {
  const appointmentRef = doc(collection(db, 'appointments'));
  const appointment = createAppointment(input, appointmentRef.id);
  const appointments = await listShopAppointments(input.barberShopId, db);

  if (hasActiveConflict(appointment, appointments)) {
    throw new Error('El barbero ya tiene una cita activa en ese horario.');
  }

  await setDoc(appointmentRef, appointment);
  return appointment;
}

export async function updateClientAppointment(appointment: Appointment, db: Firestore = getFirebaseDb()): Promise<void> {
  const appointments = await listShopAppointments(appointment.barberShopId, db);

  if (hasActiveConflict(appointment, appointments)) {
    throw new Error('El nuevo horario se cruza con otra cita activa.');
  }

  await updateDoc(doc(db, 'appointments', appointment.id), {
    barberId: appointment.barberId,
    barberName: appointment.barberName,
    durationSnapshot: appointment.durationSnapshot,
    endAt: appointment.endAt,
    priceSnapshot: appointment.priceSnapshot,
    serviceId: appointment.serviceId,
    serviceName: appointment.serviceName,
    startAt: appointment.startAt,
    updatedAt: new Date(),
  });
}

export async function transitionAppointment(
  appointmentId: string,
  status: AppointmentStatus,
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status,
    updatedAt: new Date(),
  });
}
