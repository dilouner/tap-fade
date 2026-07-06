import { createClientProfile, mergeExistingProfile } from '../userProfile';
import type { AuthenticatedUser, UserProfile } from '../types';

const now = new Date('2026-07-06T12:00:00.000Z');

const googleUser: AuthenticatedUser = {
  displayName: 'Daniel Ramirez',
  email: 'daniel@example.com',
  phoneNumber: null,
  photoURL: 'https://example.com/photo.png',
  uid: 'user-1',
};

describe('userProfile', () => {
  it('creates a normalized client profile for a new Google user', () => {
    const profile = createClientProfile(googleUser, now);

    expect(profile).toEqual({
      createdAt: now,
      displayName: 'Daniel Ramirez',
      email: 'daniel@example.com',
      phone: null,
      photoURL: 'https://example.com/photo.png',
      role: 'client',
      uid: 'user-1',
      updatedAt: now,
    });
  });

  it('preserves the existing role when refreshing profile data', () => {
    const existingProfile: UserProfile = {
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      displayName: 'Daniel',
      email: 'old@example.com',
      phone: null,
      photoURL: null,
      role: 'owner',
      uid: 'user-1',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const profile = mergeExistingProfile(existingProfile, googleUser, now);

    expect(profile.role).toBe('owner');
    expect(profile.displayName).toBe('Daniel Ramirez');
    expect(profile.email).toBe('daniel@example.com');
    expect(profile.updatedAt).toBe(now);
  });
});
