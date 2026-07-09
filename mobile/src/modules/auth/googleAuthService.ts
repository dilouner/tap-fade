import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signOut, type Auth, type UserCredential } from 'firebase/auth';

import { getFirebaseAuth } from '../../shared/firebase/config';

let configured = false;

export function configureGoogleSignIn() {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  configured = true;
}

export function getGoogleAuthErrorMessage(error: unknown): string {
  const maybeError = error as { code?: string; message?: string };

  if (maybeError.code === statusCodes.SIGN_IN_CANCELLED) {
    return 'Inicio con Google cancelado.';
  }

  if (maybeError.code === statusCodes.IN_PROGRESS) {
    return 'Ya hay un inicio con Google en progreso.';
  }

  if (maybeError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Google Play Services no esta disponible o necesita actualizarse.';
  }

  return maybeError.message ?? 'No fue posible iniciar sesion con Google.';
}

export async function signInWithGoogle(auth: Auth = getFirebaseAuth()): Promise<UserCredential> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error('Google no devolvio un idToken valido.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export async function signOutFromGoogle(auth: Auth = getFirebaseAuth()): Promise<void> {
  configureGoogleSignIn();
  await Promise.allSettled([GoogleSignin.signOut(), signOut(auth)]);
}
