import { MainNavigator } from '../../app/MainNavigator';
import { AppShell } from '../../shell/AppShell';
import { useAuth } from './AuthProvider';

export function AuthGate() {
  const auth = useAuth();

  if (auth.status === 'signedIn' && auth.profile) {
    return <MainNavigator onSignOut={auth.signOut} profile={auth.profile} />;
  }

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
