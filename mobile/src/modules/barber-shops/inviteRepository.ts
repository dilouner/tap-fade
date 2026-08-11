import * as Crypto from 'expo-crypto';
import { doc, getDoc, runTransaction, setDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { normalizeFirestoreDate, type FirestoreDate } from '../../shared/firebase/dates';
import type { BarberInvite, ShopMember } from './types';

type InviteRecord = Omit<BarberInvite, 'createdAt' | 'expiresAt' | 'usedAt'> & {
  createdAt: FirestoreDate;
  expiresAt: FirestoreDate;
  usedAt: FirestoreDate | null;
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function codeHash(code: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code.trim().toUpperCase());
}

async function generateCode() {
  const bytes = await Crypto.getRandomBytesAsync(8);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

function normalizeInvite(record: InviteRecord): BarberInvite {
  return {
    ...record,
    createdAt: normalizeFirestoreDate(record.createdAt),
    expiresAt: normalizeFirestoreDate(record.expiresAt),
    usedAt: record.usedAt ? normalizeFirestoreDate(record.usedAt) : null,
  };
}

export async function createBarberInvite(
  barberShopId: string,
  barberId: string,
  createdBy: string,
  db: Firestore = getFirebaseDb(),
) {
  const code = await generateCode();
  const hash = await codeHash(code);
  const now = new Date();
  const invite: BarberInvite = {
    acceptedBy: null,
    barberId,
    barberShopId,
    codeHash: hash,
    codePreview: code.slice(-4),
    createdAt: now,
    createdBy,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    id: hash,
    usedAt: null,
  };
  await setDoc(doc(db, 'barberInvites', hash), invite);
  return { code, invite };
}

export async function findBarberInvite(code: string, db: Firestore = getFirebaseDb()) {
  const hash = await codeHash(code);
  const snapshot = await getDoc(doc(db, 'barberInvites', hash));
  return snapshot.exists() ? normalizeInvite(snapshot.data() as InviteRecord) : null;
}

export async function acceptBarberInvite(code: string, userId: string, db: Firestore = getFirebaseDb()) {
  const hash = await codeHash(code);
  const inviteRef = doc(db, 'barberInvites', hash);
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteRef);
    if (!inviteSnapshot.exists()) throw new Error('El código no existe.');
    const invite = normalizeInvite(inviteSnapshot.data() as InviteRecord);
    const barberRef = doc(db, 'barberShops', invite.barberShopId, 'barbers', invite.barberId);
    const shopRef = doc(db, 'barberShops', invite.barberShopId);
    const memberRef = doc(db, 'barberShops', invite.barberShopId, 'members', userId);
    const [userSnapshot, barberSnapshot, shopSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(userRef), transaction.get(barberRef), transaction.get(shopRef), transaction.get(memberRef),
    ]);
    if (!inviteSnapshot.exists() || !userSnapshot.exists()) throw new Error('El código no existe.');
    if (invite.usedAt || invite.expiresAt < new Date()) throw new Error('El código ya venció o fue utilizado.');
    if (!shopSnapshot.exists() || shopSnapshot.data().status !== 'active') throw new Error('El negocio no está activo.');
    if (!barberSnapshot.exists() || barberSnapshot.data().active !== true || barberSnapshot.data().userId) throw new Error('El puesto ya fue asignado.');
    if (memberSnapshot.exists()) throw new Error('Ya perteneces a este negocio.');

    const member: ShopMember = {
      active: true,
      barberId: invite.barberId,
      barberShopId: invite.barberShopId,
      createdAt: new Date(),
      role: 'barber',
      uid: userId,
      updatedAt: new Date(),
      inviteId: hash,
    };
    const user = userSnapshot.data() as { barberShopId?: string | null; roles?: string[] };
    if (user.barberShopId && user.barberShopId !== invite.barberShopId) throw new Error('Tu cuenta ya está vinculada a otro negocio.');
    transaction.set(memberRef, member);
    transaction.update(barberRef, {
      updatedAt: new Date(),
      userId,
    });
    transaction.update(userRef, {
      role: 'barber',
      roles: Array.from(new Set(['client', ...(user.roles ?? []), 'barber'])),
      barberShopId: invite.barberShopId,
      updatedAt: new Date(),
    });
    transaction.update(inviteRef, { acceptedBy: userId, usedAt: new Date() });
  });
}
