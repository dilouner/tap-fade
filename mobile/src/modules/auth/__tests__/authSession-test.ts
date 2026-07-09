import type { User } from 'firebase/auth';

import { createErrorSession, createSignedInSession, createSignedOutSession } from '../authSession';
import type { UserProfile } from '../../users/types';

const firebaseUser = { uid: 'user-1' } as User;
const profile: UserProfile = {
  createdAt: new Date('2026-07-06T12:00:00.000Z'),
  displayName: 'Daniel Ramirez',
  email: 'daniel@example.com',
  phone: null,
  photoURL: null,
  role: 'client',
  uid: 'user-1',
  updatedAt: new Date('2026-07-06T12:00:00.000Z'),
};

describe('authSession', () => {
  it('creates a signed out session', () => {
    expect(createSignedOutSession()).toMatchObject({
      error: null,
      firebaseUser: null,
      profile: null,
      status: 'signedOut',
    });
  });

  it('creates a signed in session', () => {
    expect(createSignedInSession(firebaseUser, profile)).toMatchObject({
      error: null,
      firebaseUser,
      profile,
      status: 'signedIn',
    });
  });

  it('creates an error session', () => {
    expect(createErrorSession('No fue posible iniciar sesion.')).toMatchObject({
      error: 'No fue posible iniciar sesion.',
      profile: null,
      status: 'error',
    });
  });
});
