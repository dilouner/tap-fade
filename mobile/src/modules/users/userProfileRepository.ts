import { collection, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { createClientProfile, mergeExistingProfile } from './userProfile';
import type { AuthenticatedUser, UserProfile, UserRole } from './types';

type UserProfileRecord = Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
};

function normalizeDate(value: Date | { toDate: () => Date }): Date {
  return value instanceof Date ? value : value.toDate();
}

function normalizeProfile(record: UserProfileRecord): UserProfile {
  const roles = Array.isArray(record.roles) && record.roles.length > 0
    ? Array.from(new Set<UserRole>(['client', ...record.roles]))
    : Array.from(new Set<UserRole>(['client', record.role ?? 'client']));
  return {
    ...record,
    role: record.role ?? roles.find((role) => role !== 'client') ?? 'client',
    roles,
    createdAt: normalizeDate(record.createdAt),
    updatedAt: normalizeDate(record.updatedAt),
  };
}

export async function getOrCreateClientProfile(
  user: AuthenticatedUser,
  db: Firestore = getFirebaseDb(),
): Promise<UserProfile> {
  const profileRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    const newProfile = createClientProfile(user);
    await setDoc(profileRef, newProfile);
    return newProfile;
  }

  const profile = normalizeProfile(snapshot.data() as UserProfileRecord);
  const updatedProfile = mergeExistingProfile(profile, user);
  await setDoc(profileRef, updatedProfile, { merge: true });

  return updatedProfile;
}

export async function promoteUserToOwner(userId: string, ownerShopId: string, db: Firestore = getFirebaseDb()): Promise<void> {
  const profile = await getUserProfile(userId, db);
  const roles = Array.from(new Set<UserRole>(['client', ...(profile?.roles ?? []), 'owner']));
  await updateDoc(doc(db, 'users', userId), {
    role: 'owner',
    roles,
    ownerShopId,
    updatedAt: new Date(),
  });
}

export async function listUsers(db: Firestore = getFirebaseDb()): Promise<UserProfile[]> {
  const snapshot = await getDocs(query(collection(db, 'users'), limit(250)));
  return snapshot.docs.map((item) => normalizeProfile(item.data() as UserProfileRecord));
}

export async function getUserProfile(userId: string, db: Firestore = getFirebaseDb()): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', userId));
  return snapshot.exists() ? normalizeProfile(snapshot.data() as UserProfileRecord) : null;
}

export async function updateUserRole(userId: string, role: UserRole, db: Firestore = getFirebaseDb()): Promise<void> {
  const profile = await getUserProfile(userId, db);
  const roles = role === 'client'
    ? ['client']
    : Array.from(new Set<UserRole>(['client', ...(profile?.roles ?? []), role]));
  await updateDoc(doc(db, 'users', userId), {
    role,
    roles,
    updatedAt: new Date(),
  });
}


export async function updateUserRoles(userId: string, roles: UserRole[], db: Firestore = getFirebaseDb()): Promise<void> {
  const normalized = Array.from(new Set<UserRole>(['client', ...roles]));
  await updateDoc(doc(db, 'users', userId), {
    role: normalized.find((role) => role !== 'client') ?? 'client',
    roles: normalized,
    updatedAt: new Date(),
  });
}

export async function updateOwnProfile(
  userId: string,
  input: Pick<UserProfile, 'displayName' | 'phone'>,
  db: Firestore = getFirebaseDb(),
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    displayName: input.displayName.trim(),
    phone: input.phone?.trim() || null,
    updatedAt: new Date(),
  });
}
