import { collection, doc, setDoc, writeBatch, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import type { BarberShopStatus } from '../barber-shops/types';
import type { UserRole } from '../users/types';

export async function recordAdminAudit(input: {
  actorId: string;
  action: string;
  targetId: string;
  detail: string;
}, db: Firestore = getFirebaseDb()) {
  const auditRef = doc(collection(db, 'adminAudit'));
  await setDoc(auditRef, { ...input, createdAt: new Date(), id: auditRef.id });
}

export async function updateShopStatusWithAudit(shopId: string, status: BarberShopStatus, actorId: string, db: Firestore = getFirebaseDb()) {
  const auditRef = doc(collection(db, 'adminAudit'));
  const batch = writeBatch(db);
  batch.set(auditRef, { action: 'update_shop_status', actorId, createdAt: new Date(), detail: status, id: auditRef.id, targetId: shopId });
  batch.update(doc(db, 'barberShops', shopId), { lastAuditId: auditRef.id, status, updatedAt: new Date() });
  await batch.commit();
}

export async function updateUserRolesWithAudit(userId: string, roles: UserRole[], actorId: string, db: Firestore = getFirebaseDb()) {
  const normalized = Array.from(new Set<UserRole>(['client', ...roles]));
  const auditRef = doc(collection(db, 'adminAudit'));
  const batch = writeBatch(db);
  batch.set(auditRef, { action: 'update_user_roles', actorId, createdAt: new Date(), detail: normalized.join(','), id: auditRef.id, targetId: userId });
  batch.update(doc(db, 'users', userId), { lastAuditId: auditRef.id, role: normalized.find((role) => role !== 'client') ?? 'client', roles: normalized, updatedAt: new Date() });
  await batch.commit();
}
