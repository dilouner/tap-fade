import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { getFirebaseAuth } from '../../shared/firebase/config';
import { getOrCreateClientProfile } from '../users/userProfileRepository';
import { createErrorSession, createSignedInSession, createSignedOutSession } from './authSession';
import { getGoogleAuthErrorMessage, signInWithGoogle, signOutFromGoogle } from './googleAuthService';
import { initialAuthSession, type AuthSession } from './types';

type AuthContextValue = AuthSession & {
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(initialAuthSession);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

      if (!firebaseUser) {
        setSession(createSignedOutSession());
        return;
      }

      try {
        const profile = await getOrCreateClientProfile(firebaseUser);
        if (mounted) {
          setSession(createSignedInSession(firebaseUser, profile));
        }
      } catch (error) {
        if (mounted) {
          setSession(createErrorSession(error instanceof Error ? error.message : 'No fue posible cargar el perfil.', firebaseUser));
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signInGoogle = useCallback(async () => {
    setIsSigningIn(true);
    setSession((current) => ({ ...current, error: null }));

    try {
      const credential = await signInWithGoogle();
      const profile = await getOrCreateClientProfile(credential.user);
      setSession(createSignedInSession(credential.user, profile));
    } catch (error) {
      setSession((current) => ({
        ...current,
        error: getGoogleAuthErrorMessage(error),
        status: current.firebaseUser ? current.status : 'signedOut',
      }));
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutFromGoogle();
    setSession(createSignedOutSession());
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      signInGoogle,
      signOut,
      status: isSigningIn ? 'loading' : session.status,
    }),
    [isSigningIn, session, signInGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return value;
}
