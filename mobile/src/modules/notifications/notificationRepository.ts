import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import type { AppNotification, NotificationInput } from './types';

type NotificationRecord = Omit<AppNotification, 'createdAt' | 'readAt'> & {
  createdAt: FirestoreDate;
  readAt: FirestoreDate | null;
};

function normalizeNotification(record: NotificationRecord): AppNotification {
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    readAt: record.readAt ? normalizeFirestoreDate(record.readAt) : null,
  };
}

export async function listNotifications(userId: string, db: Firestore = getFirebaseDb()) {
  const snapshot = await getDocs(query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(100)));
  return snapshot.docs.map((item) => normalizeNotification(item.data() as NotificationRecord));
}

export function subscribeNotifications(userId: string, onData: (items: AppNotification[]) => void, onError: (error: Error) => void, db: Firestore = getFirebaseDb()): Unsubscribe {
  return onSnapshot(query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(100)),
    (snapshot) => onData(snapshot.docs.map((item) => normalizeNotification(item.data() as NotificationRecord))), onError);
}

export async function createNotification(input: NotificationInput, db: Firestore = getFirebaseDb()) {
  const stableId = `${input.appointmentId ?? input.type}_${input.revision}_${input.recipientId}`;
  const notification: AppNotification = {
    ...input,
    id: stableId,
    createdAt: new Date(),
    readAt: null,
  };
  await setDoc(doc(db, 'users', input.recipientId, 'notifications', stableId), notification);
  return notification;
}

export async function markNotificationRead(userId: string, notificationId: string, db: Firestore = getFirebaseDb()) {
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { readAt: new Date() });
}

export async function markAllNotificationsRead(notifications: AppNotification[], db: Firestore = getFirebaseDb()) {
  await Promise.all(
    notifications.filter((item) => !item.readAt).map((item) => markNotificationRead(item.recipientId, item.id, db)),
  );
}
