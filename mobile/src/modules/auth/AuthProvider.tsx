import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  updateProfile,
} from 'firebase/auth';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { getFirebaseAuth, getFirebaseDb } from '../../shared/firebase/config';
import { getOrCreateClientProfile } from '../users/userProfileRepository';
import { createErrorSession, createSignedInSession, createSignedOutSession } from './authSession';
import { getGoogleAuthErrorMessage, reauthenticateWithGoogle, signInWithGoogle, signOutFromGoogle } from './googleAuthService';
import { clearAppointmentReminders } from '../notifications/localReminders';
import { listClientAppointments, transitionAppointment } from '../appointments/appointmentRepository';
import { initialAuthSession, type AuthSession } from './types';

type AuthContextValue = AuthSession & {
  deleteAccount: (password?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
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

  const signInEmail = useCallback(async (email: string, password: string) => {
    setIsSigningIn(true);
    setSession((current) => ({ ...current, error: null }));

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getOrCreateClientProfile(credential.user);
      setSession(createSignedInSession(credential.user, profile));
    } catch (error) {
      setSession((current) => ({
        ...current,
        error: getAuthErrorMessage(error),
        status: current.firebaseUser ? current.status : 'signedOut',
      }));
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signUpEmail = useCallback(async (name: string, email: string, password: string) => {
    setIsSigningIn(true);
    setSession((current) => ({ ...current, error: null }));
    try {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      const profile = await getOrCreateClientProfile(credential.user);
      setSession(createSignedInSession(credential.user, profile));
    } catch (error) {
      setSession((current) => ({
        ...current,
        error: getAuthErrorMessage(error),
        status: current.firebaseUser ? current.status : 'signedOut',
      }));
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    await user.reload();
    const profile = await getOrCreateClientProfile(user);
    setSession(createSignedInSession(user, profile));
  }, []);

  const deleteAccount = useCallback(async (password?: string) => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    if (session.profile?.ownerShopId) throw new Error('Transfiere o cierra tu negocio antes de eliminar la cuenta.');
    if (user.providerData.some((provider) => provider.providerId === 'password')) {
      if (!user.email || !password) throw new Error('Escribe tu contraseña actual para continuar.');
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    } else {
      await reauthenticateWithGoogle(user);
    }
    const appointments = await listClientAppointments(user.uid);
    const active = appointments.filter((item) => ['pending', 'confirmed'].includes(item.status));
    for (const appointment of active) await transitionAppointment(appointment, 'cancelled', user.uid);
    const db = getFirebaseDb();
    const notifications = await getDocs(collection(db, 'users', user.uid, 'notifications'));
    const batch = writeBatch(db);
    const activeIds = new Set(active.map((item) => item.id));
    appointments.forEach((appointment) => batch.update(doc(db, 'appointments', appointment.id), { clientName: 'Usuario eliminado', revision: appointment.revision + (activeIds.has(appointment.id) ? 2 : 1), updatedAt: new Date() }));
    notifications.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(doc(db, 'users', user.uid));
    await batch.commit();
    await clearAppointmentReminders();
    await deleteUser(user);
    setSession(createSignedOutSession());
  }, [session.profile?.ownerShopId]);

  const signOut = useCallback(async () => {
    await clearAppointmentReminders();
    await signOutFromGoogle();
    setSession(createSignedOutSession());
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      deleteAccount,
      refreshProfile,
      resetPassword,
      signInEmail,
      signInGoogle,
      signUpEmail,
      signOut,
      status: isSigningIn ? 'loading' : session.status,
    }),
    [deleteAccount, isSigningIn, refreshProfile, resetPassword, session, signInEmail, signInGoogle, signOut, signUpEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


function getAuthErrorMessage(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/email-already-in-use') return 'Ese correo ya tiene una cuenta.';
  if (code === 'auth/invalid-email') return 'Escribe un correo válido.';
  if (code === 'auth/weak-password') return 'Usa una contraseña de al menos 8 caracteres.';
  if (code === 'auth/requires-recent-login') return 'Vuelve a iniciar sesión antes de eliminar tu cuenta.';
  return error instanceof Error ? error.message : 'No fue posible completar la operación.';
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return value;
}
