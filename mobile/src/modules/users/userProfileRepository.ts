import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { getFirebaseDb } from '../../shared/firebase/config';
import { createClientProfile, mergeExistingProfile } from './userProfile';
import type { AuthenticatedUser, UserProfile } from './types';

type UserProfileRecord = Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
};

function normalizeDate(value: Date | { toDate: () => Date }): Date {
  return value instanceof Date ? value : value.toDate();
}

function normalizeProfile(record: UserProfileRecord): UserProfile {
  return {
    ...record,
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

export async function promoteUserToOwner(userId: string, db: Firestore = getFirebaseDb()): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    role: 'owner',
    updatedAt: new Date(),
  });
}
