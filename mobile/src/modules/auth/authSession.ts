import type { User } from 'firebase/auth';

import type { UserProfile } from '../users/types';
import { initialAuthSession, type AuthSession } from './types';

export function createSignedOutSession(): AuthSession {
  return {
    ...initialAuthSession,
    status: 'signedOut',
  };
}

export function createSignedInSession(firebaseUser: User, profile: UserProfile): AuthSession {
  return {
    error: null,
    firebaseUser,
    profile,
    status: 'signedIn',
  };
}

export function createErrorSession(message: string, firebaseUser: User | null = null): AuthSession {
  return {
    error: message,
    firebaseUser,
    profile: null,
    status: 'error',
  };
}
