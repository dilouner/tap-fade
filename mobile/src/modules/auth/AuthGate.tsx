import { AppShell } from '../../shell/AppShell';
import { useAuth } from './AuthProvider';

export function AuthGate() {
  const auth = useAuth();

  return (
    <AppShell
      authError={auth.error}
      authStatus={auth.status}
      onGooglePress={auth.signInGoogle}
      onSignOutPress={auth.signOut}
      profile={auth.profile}
    />
  );
}
