import type { AuthenticatedUser, UserProfile } from './types';

export function createClientProfile(user: AuthenticatedUser, now = new Date()): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    phone: user.phoneNumber,
    photoURL: user.photoURL,
    role: 'client',
    roles: ['client'],
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeExistingProfile(
  existingProfile: UserProfile,
  user: AuthenticatedUser,
  now = new Date(),
): UserProfile {
  return {
    ...existingProfile,
    displayName: user.displayName ?? existingProfile.displayName,
    email: user.email ?? existingProfile.email,
    phone: user.phoneNumber ?? existingProfile.phone,
    photoURL: user.photoURL ?? existingProfile.photoURL,
    roles: normalizeRoles(existingProfile.roles, existingProfile.role),
    updatedAt: now,
  };
}

export function normalizeRoles(roles: UserProfile['roles'] | undefined, legacyRole: UserProfile['role'] = 'client') {
  const normalized = new Set<UserProfile['role']>(['client', ...(roles ?? []), legacyRole]);
  return [...normalized];
}
