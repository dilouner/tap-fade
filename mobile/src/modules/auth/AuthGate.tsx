import { MainNavigator } from '../../app/MainNavigator';
import { useAuth } from './AuthProvider';

export function AuthGate() {
  const auth = useAuth();
  return (
    <MainNavigator
      actions={{
        deleteAccount: auth.deleteAccount,
        resetPassword: auth.resetPassword,
        signInEmail: auth.signInEmail,
        signInGoogle: auth.signInGoogle,
        signOut: auth.signOut,
        signUpEmail: auth.signUpEmail,
      }}
      authError={auth.error}
      profile={auth.profile}
    />
  );
}
