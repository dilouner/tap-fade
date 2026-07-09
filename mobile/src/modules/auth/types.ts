import type { User } from 'firebase/auth';

import type { UserProfile } from '../users/types';

export type AuthSessionStatus = 'loading' | 'signedOut' | 'signedIn' | 'error';

export type AuthSession = {
  status: AuthSessionStatus;
  firebaseUser: User | null;
  profile: UserProfile | null;
  error: string | null;
};

export const initialAuthSession: AuthSession = {
  error: null,
  firebaseUser: null,
  profile: null,
  status: 'loading',
};
