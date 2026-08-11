import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  onSnapshot,
  where,
  type DocumentReference,
  type Firestore,
  type Transaction,
  type Unsubscribe,
} from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import { addMinutes, assertAppointmentWindow, canTransitionAppointment, createAppointment } from './appointmentRules';
import type { Appointment, AppointmentInput, AppointmentStatus, RescheduleRequest } from './types';
import type { NotificationType } from '../notifications/types';
import { listShopAvailability } from '../availability/availabilityRepository';
import { getAvailableSlots } from '../availability/slotGeneration';
import { TZDate } from '@date-fns/tz';

type AppointmentRecord = Omit<Appointment, 'createdAt' | 'updatedAt' | 'startAt' | 'endAt' | 'rescheduleRequest'> & {
  createdAt: FirestoreDate;
  endAt: FirestoreDate;
  startAt: FirestoreDate;
  updatedAt: FirestoreDate;
  rescheduleRequest?: null | Omit<RescheduleRequest, 'startAt' | 'endAt' | 'requestedAt'> & {
    startAt: FirestoreDate;
    endAt: FirestoreDate;
    requestedAt: FirestoreDate;
  };
};

type SlotLock = {
  appointmentId: string;
  barberId: string;
  barberShopId: string;
  clientId: string;
  purpose: 'appointment' | 'reschedule';
  slotAt: Date;
};

function normalizeReschedule(value: AppointmentRecord['rescheduleRequest']): RescheduleRequest | null {
  if (!value) return null;
  return {
    ...value,
    endAt: normalizeFirestoreDate(value.endAt),
    requestedAt: normalizeFirestoreDate(value.requestedAt),
    startAt: normalizeFirestoreDate(value.startAt),
  };
}

function normalizeAppointment(record: AppointmentRecord): Appointment {
  const startAt = normalizeFirestoreDate(record.startAt);
  const rescheduleRequest = normalizeReschedule(record.rescheduleRequest);
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    endAt: normalizeFirestoreDate(record.endAt),
    rescheduleRequest: rescheduleRequest ? {
      ...rescheduleRequest,
      slotIds: rescheduleRequest.slotIds?.length
        ? rescheduleRequest.slotIds
        : buildLegacySlotIds(record.barberId, rescheduleRequest.startAt, record.durationSnapshot),
    } : null,
    revision: record.revision ?? 1,
    slotIds: record.slotIds ?? buildLegacySlotIds(record.barberId, startAt, record.durationSnapshot),
    startAt,
    updatedAt: normalizeFirestoreDate(record.updatedAt),
  };
}

function slotTimeKey(slot: Date) {
  return slot.toISOString().replace(/[^0-9]/g, '').slice(0, 12);
}

export function buildLegacySlotIds(barberId: string, startAt: Date, durationMinutes: number) {
  const count = Math.ceil(durationMinutes / 15);
  return Array.from({ length: count }, (_, index) => {
    const slot = addMinutes(startAt, index * 15);
    return `${barberId}_${slotTimeKey(slot)}`;
  });
}

export function buildSlotIds(barberShopId: string, barberId: string, startAt: Date, durationMinutes: number) {
  const count = Math.ceil(durationMinutes / 15);
  return Array.from({ length: count }, (_, index) => `${barberShopId}_${barberId}_${slotTimeKey(addMinutes(startAt, index * 15))}`);
}

function refsFromIds(db: Firestore, ids: string[]) {
  return ids.map((id) => doc(db, 'appointmentSlots', id));
}

async function ensureSlotsAvailable(transaction: Transaction, refs: DocumentReference[]) {
  const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
  if (snapshots.some((snapshot) => snapshot.exists())) {
    throw new Error('Ese horario acaba de ocuparse. Elige otra hora.');
  }
}

function setLocks(
  transaction: Transaction,
  refs: DocumentReference[],
  appointment: Appointment,
  purpose: SlotLock['purpose'],
) {
  refs.forEach((ref, index) => {
    const lock: SlotLock = {
      appointmentId: appointment.id,
      barberId: appointment.barberId,
      barberShopId: appointment.barberShopId,
      clientId: appointment.clientId,
      purpose,
      slotAt: addMinutes(purpose === 'appointment' ? appointment.startAt : appointment.rescheduleRequest!.startAt, index * 15),
    };
    transaction.set(ref, lock);
  });
}

function deleteLocks(transaction: Transaction, refs: DocumentReference[]) {
  refs.forEach((ref) => transaction.delete(ref));
}

async function operatorIds(transaction: Transaction, db: Firestore, appointment: Appointment) {
  const [shop, barber] = await Promise.all([
    transaction.get(doc(db, 'barberShops', appointment.barberShopId)),
    transaction.get(doc(db, 'barberShops', appointment.barberShopId, 'barbers', appointment.barberId)),
  ]);
  return Array.from(new Set([
    shop.data()?.ownerId as string | undefined,
    barber.data()?.userId as string | undefined,
  ].filter((value): value is string => Boolean(value))));
}

function setNotification(transaction: Transaction, db: Firestore, input: {
  actorId: string;
  appointment: Appointment;
  body: string;
  recipientId: string;
  revision: number;
  title: string;
  type: NotificationType;
}) {
  const id = `${input.appointment.id}_${input.type}_${input.revision}_${input.recipientId}`;
  transaction.set(doc(db, 'users', input.recipientId, 'notifications', id), {
    actorId: input.actorId,
    appointmentId: input.appointment.id,
    body: input.body,
    createdAt: new Date(),
    id,
    readAt: null,
    recipientId: input.recipientId,
    revision: input.revision,
    title: input.title,
    type: input.type,
  });
}

export async function listShopAppointments(barberShopId: string, db: Firestore = getFirebaseDb()): Promise<Appointment[]> {
  const snapshot = await getDocs(query(collection(db, 'appointments'), where('barberShopId', '==', barberShopId), limit(250)));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export async function listBarberAppointments(
  barberShopId: string,
  barberId: string,
  db: Firestore = getFirebaseDb(),
): Promise<Appointment[]> {
  const snapshot = await getDocs(query(
    collection(db, 'appointments'),
    where('barberShopId', '==', barberShopId),
    where('barberId', '==', barberId),
    limit(250),
  ));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export async function listClientAppointments(clientId: string, db: Firestore = getFirebaseDb()): Promise<Appointment[]> {
  const snapshot = await getDocs(query(collection(db, 'appointments'), where('clientId', '==', clientId), limit(100)));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export function subscribeClientAppointments(clientId: string, onData: (items: Appointment[]) => void, onError: (error: Error) => void, db: Firestore = getFirebaseDb()): Unsubscribe {
  return onSnapshot(query(collection(db, 'appointments'), where('clientId', '==', clientId)),
    (snapshot) => onData(snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord))), onError);
}

export function subscribeShopAppointments(barberShopId: string, onData: (items: Appointment[]) => void, onError: (error: Error) => void, db: Firestore = getFirebaseDb()): Unsubscribe {
  return onSnapshot(query(collection(db, 'appointments'), where('barberShopId', '==', barberShopId)),
    (snapshot) => onData(snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord))), onError);
}

export function subscribeBarberAppointments(barberShopId: string, barberId: string, onData: (items: Appointment[]) => void, onError: (error: Error) => void, db: Firestore = getFirebaseDb()): Unsubscribe {
  return onSnapshot(query(collection(db, 'appointments'), where('barberShopId', '==', barberShopId), where('barberId', '==', barberId)),
    (snapshot) => onData(snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord))), onError);
}

export async function listAllAppointments(db: Firestore = getFirebaseDb()): Promise<Appointment[]> {
  const snapshot = await getDocs(query(collection(db, 'appointments'), limit(500)));
  return snapshot.docs.map((item) => normalizeAppointment(item.data() as AppointmentRecord));
}

export async function listBarberOccupiedSlots(
  barberShopId: string,
  barberId: string,
  db: Firestore = getFirebaseDb(),
): Promise<Date[]> {
  const snapshot = await getDocs(query(collection(db, 'appointmentSlots'), where('barberId', '==', barberId), limit(1000)));
  return snapshot.docs
    .map((item) => item.data() as Partial<SlotLock>)
    .filter((item) => item.barberShopId === barberShopId && item.slotAt)
    .map((item) => normalizeFirestoreDate(item.slotAt as unknown as FirestoreDate));
}

async function assertStartAvailable(input: { barberId: string; barberShopId: string; durationMinutes: number; startAt: Date; timezone: string }, db: Firestore) {
  const [availability, occupiedSlots] = await Promise.all([
    listShopAvailability(input.barberShopId, db), listBarberOccupiedSlots(input.barberShopId, input.barberId, db),
  ]);
  const shopDate = new TZDate(input.startAt, input.timezone);
  const slots = getAvailableSlots({ availability, barberId: input.barberId, date: shopDate, durationMinutes: input.durationMinutes, occupiedSlots, timezone: input.timezone });
  if (!slots.some((slot) => slot.getTime() === input.startAt.getTime())) throw new Error('El horario no pertenece a la disponibilidad actual del barbero.');
}

export async function createClientAppointment(input: AppointmentInput, db: Firestore = getFirebaseDb()): Promise<Appointment> {
  if (input.durationSnapshot < 15 || input.durationSnapshot > 180 || input.durationSnapshot % 15 !== 0) {
    throw new Error('La duración del servicio no es válida.');
  }
  assertAppointmentWindow(input.startAt);

  const [shopSnapshot, serviceSnapshot, barberSnapshot] = await Promise.all([
    getDoc(doc(db, 'barberShops', input.barberShopId)),
    getDoc(doc(db, 'barberShops', input.barberShopId, 'services', input.serviceId)),
    getDoc(doc(db, 'barberShops', input.barberShopId, 'barbers', input.barberId)),
  ]);
  const shop = shopSnapshot.data();
  const service = serviceSnapshot.data();
  const barber = barberSnapshot.data();
  if (!shopSnapshot.exists() || shop?.status !== 'active') throw new Error('La barbería no está disponible.');
  if (!serviceSnapshot.exists() || service?.active !== true) throw new Error('El servicio ya no está disponible.');
  if (!barberSnapshot.exists() || barber?.active !== true) throw new Error('El barbero ya no está disponible.');
  if (service?.durationMinutes !== input.durationSnapshot || service?.price !== input.priceSnapshot) throw new Error('El servicio cambió. Actualiza la reserva.');
  if (Array.isArray(barber?.serviceIds) && barber.serviceIds.length > 0 && !barber.serviceIds.includes(input.serviceId)) throw new Error('El barbero no realiza este servicio.');
  await assertStartAvailable({ barberId: input.barberId, barberShopId: input.barberShopId, durationMinutes: input.durationSnapshot, startAt: input.startAt, timezone: shop?.timezone ?? 'America/Chihuahua' }, db);

  const appointmentRef = doc(collection(db, 'appointments'));
  const slotIds = buildSlotIds(input.barberShopId, input.barberId, input.startAt, input.durationSnapshot);
  const appointment = { ...createAppointment(input, appointmentRef.id), slotIds };
  const refs = refsFromIds(db, slotIds);

  await runTransaction(db, async (transaction) => {
    await ensureSlotsAvailable(transaction, refs);
    const recipients = await operatorIds(transaction, db, appointment);
    transaction.set(appointmentRef, appointment);
    setLocks(transaction, refs, appointment, 'appointment');
    recipients.forEach((recipientId) => setNotification(transaction, db, {
      actorId: appointment.clientId, appointment, body: `${appointment.clientName} solicitó ${appointment.serviceName}.`,
      recipientId, revision: appointment.revision, title: 'Nueva solicitud de cita', type: 'appointment_requested',
    }));
  });

  return appointment;
}

export async function requestAppointmentReschedule(
  appointment: Appointment,
  startAt: Date,
  requestedBy: string,
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  const request: RescheduleRequest = {
    startAt,
    endAt: addMinutes(startAt, appointment.durationSnapshot),
    requestedAt: new Date(),
    requestedBy,
    slotIds: buildSlotIds(appointment.barberShopId, appointment.barberId, startAt, appointment.durationSnapshot),
  };
  const candidate: Appointment = { ...appointment, rescheduleRequest: request };
  assertAppointmentWindow(startAt);
  const shopSnapshot = await getDoc(doc(db, 'barberShops', appointment.barberShopId));
  if (!shopSnapshot.exists() || shopSnapshot.data().status !== 'active') throw new Error('La barbería no está disponible.');
  await assertStartAvailable({ barberId: appointment.barberId, barberShopId: appointment.barberShopId, durationMinutes: appointment.durationSnapshot, startAt, timezone: shopSnapshot.data().timezone ?? 'America/Chihuahua' }, db);
  const refs = refsFromIds(db, request.slotIds);

  await runTransaction(db, async (transaction) => {
    const currentSnapshot = await transaction.get(doc(db, 'appointments', appointment.id));
    if (!currentSnapshot.exists()) throw new Error('La cita ya no existe.');
    const current = normalizeAppointment(currentSnapshot.data() as AppointmentRecord);
    if (current.revision !== appointment.revision || current.rescheduleRequest) throw new Error('La cita cambió. Actualiza e intenta de nuevo.');
    if (!['pending', 'confirmed'].includes(current.status) || current.startAt < addMinutes(new Date(), 60)) throw new Error('Esta cita ya no se puede reagendar.');
    await ensureSlotsAvailable(transaction, refs);
    const recipients = requestedBy === appointment.clientId ? await operatorIds(transaction, db, appointment) : [appointment.clientId];
    transaction.update(doc(db, 'appointments', appointment.id), {
      rescheduleRequest: request,
      revision: appointment.revision + 1,
      updatedAt: new Date(),
    });
    setLocks(transaction, refs, candidate, 'reschedule');
    recipients.forEach((recipientId) => setNotification(transaction, db, {
      actorId: requestedBy, appointment, body: `Se propuso un nuevo horario para ${appointment.serviceName}.`, recipientId,
      revision: appointment.revision + 1, title: 'Solicitud de cambio', type: 'reschedule_requested',
    }));
  });
}

export async function resolveAppointmentReschedule(
  appointment: Appointment,
  accept: boolean,
  actorId = appointment.clientId,
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  if (!appointment.rescheduleRequest) return;
  const oldRefs = refsFromIds(db, appointment.slotIds);
  const requestedRefs = refsFromIds(db, appointment.rescheduleRequest.slotIds);

  await runTransaction(db, async (transaction) => {
    const currentSnapshot = await transaction.get(doc(db, 'appointments', appointment.id));
    if (!currentSnapshot.exists()) throw new Error('La cita ya no existe.');
    const current = normalizeAppointment(currentSnapshot.data() as AppointmentRecord);
    if (current.revision !== appointment.revision || !current.rescheduleRequest) throw new Error('La cita cambió. Actualiza e intenta de nuevo.');
    if (accept) deleteLocks(transaction, oldRefs);
    else deleteLocks(transaction, requestedRefs);
    transaction.update(doc(db, 'appointments', appointment.id), accept ? {
      endAt: appointment.rescheduleRequest!.endAt,
      rescheduleRequest: null,
      revision: appointment.revision + 1,
      slotIds: appointment.rescheduleRequest!.slotIds,
      startAt: appointment.rescheduleRequest!.startAt,
      updatedAt: new Date(),
    } : {
      rescheduleRequest: null,
      revision: appointment.revision + 1,
      updatedAt: new Date(),
    });
    setNotification(transaction, db, {
      actorId, appointment, body: accept ? 'El nuevo horario fue aceptado.' : 'El cambio de horario fue rechazado.',
      recipientId: appointment.clientId, revision: appointment.revision + 1, title: 'Cambio de cita',
      type: accept ? 'reschedule_accepted' : 'reschedule_rejected',
    });
  });
}

export async function transitionAppointment(
  appointment: Appointment,
  status: AppointmentStatus,
  actorId = appointment.clientId,
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  if (!canTransitionAppointment(appointment.status, status)) {
    throw new Error('Ese cambio de estado ya no está disponible.');
  }
  if (status === 'cancelled' && appointment.startAt < addMinutes(new Date(), 60)) throw new Error('Ya no es posible cancelar dentro de la última hora.');
  if (status === 'completed' && appointment.endAt > new Date()) throw new Error('La cita todavía no termina.');
  const shouldRelease = ['rejected', 'cancelled', 'completed'].includes(status);
  const activeRefs = refsFromIds(db, appointment.slotIds);
  const rescheduleRefs = appointment.rescheduleRequest
    ? refsFromIds(db, appointment.rescheduleRequest.slotIds)
    : [];

  await runTransaction(db, async (transaction) => {
    const currentSnapshot = await transaction.get(doc(db, 'appointments', appointment.id));
    if (!currentSnapshot.exists()) throw new Error('La cita ya no existe.');
    const current = normalizeAppointment(currentSnapshot.data() as AppointmentRecord);
    if (current.revision !== appointment.revision || !canTransitionAppointment(current.status, status)) throw new Error('La cita cambió. Actualiza e intenta de nuevo.');
    const recipients = actorId === appointment.clientId ? await operatorIds(transaction, db, appointment) : [appointment.clientId];
    if (shouldRelease) {
      deleteLocks(transaction, [...activeRefs, ...rescheduleRefs]);
    }
    transaction.update(doc(db, 'appointments', appointment.id), {
      rescheduleRequest: shouldRelease ? null : appointment.rescheduleRequest,
      revision: appointment.revision + 1,
      status,
      updatedAt: new Date(),
    });
    if (status !== 'completed') recipients.forEach((recipientId) => setNotification(transaction, db, {
      actorId, appointment, body: `${appointment.serviceName}: ${status}.`, recipientId,
      revision: appointment.revision + 1, title: 'Actualización de cita',
      type: status === 'confirmed' ? 'appointment_confirmed' : status === 'rejected' ? 'appointment_rejected' : 'appointment_cancelled',
    }));
  });
}

/** @deprecated Use requestAppointmentReschedule so the original appointment remains protected. */
export async function updateClientAppointment(appointment: Appointment, db: Firestore = getFirebaseDb()): Promise<void> {
  await requestAppointmentReschedule(appointment, appointment.startAt, appointment.clientId, db);
}
