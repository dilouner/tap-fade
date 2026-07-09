/* eslint-disable import/first */
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  },
}));

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../../../shared/firebase/config', () => ({
  getFirebaseAuth: jest.fn(),
}));

import { getGoogleAuthErrorMessage } from '../googleAuthService';

describe('googleAuthService', () => {
  it('maps cancelled Google sign in to a user-facing message', () => {
    expect(getGoogleAuthErrorMessage({ code: 'SIGN_IN_CANCELLED' })).toBe('Inicio con Google cancelado.');
  });

  it('falls back to the original error message', () => {
    expect(getGoogleAuthErrorMessage({ message: 'Firebase failed' })).toBe('Firebase failed');
  });
});
