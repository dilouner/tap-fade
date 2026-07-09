import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AuthSessionStatus } from '../modules/auth/types';
import type { UserProfile } from '../modules/users/types';
import { InputField } from '../shared/components/InputField';
import { PrimaryButton } from '../shared/components/PrimaryButton';
import { SocialButton } from '../shared/components/SocialButton';
import { colors, spacing, typography } from '../shared/theme';

const tapFadeLogo = require('../../assets/logo-primary-stacked-color-trimmed.png');
const steppedPattern = require('../../assets/brand-pattern-stepped-light.png');

type AppShellProps = {
  authError?: string | null;
  authStatus?: AuthSessionStatus;
  onGooglePress?: () => void;
  onSignOutPress?: () => void;
  profile?: UserProfile | null;
};

export function AppShell({
  authError,
  authStatus = 'signedOut',
  onGooglePress,
  onSignOutPress,
  profile,
}: AppShellProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isAuthLoading = authStatus === 'loading';
  const isSignedIn = authStatus === 'signedIn';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.keyboard}>
        <View style={styles.sideRail}>
          <View style={styles.blueRail} />
          <View style={styles.blackRail} />
          <View style={styles.mintRail} />
          <View style={styles.greyRail} />
        </View>

        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Image source={tapFadeLogo} resizeMode="contain" style={styles.logo} />
            <View style={styles.logoDivider}>
              <View style={styles.logoDividerMint} />
              <View style={styles.logoDividerBlue} />
            </View>
          </View>

          <View style={styles.headlineBlock}>
            <Text style={styles.title}>{isSignedIn ? 'Sesion activa' : 'Bienvenido de nuevo'}</Text>
            <Text style={styles.subtitle}>
              {isSignedIn ? `Rol actual: ${profile?.role ?? 'client'}` : 'Inicia sesion para continuar'}
            </Text>
          </View>

          <View style={styles.formBlock}>
            {isSignedIn ? (
              <View style={styles.sessionCard}>
                <Text style={styles.sessionTitle}>{profile?.displayName || 'Usuario TapFade'}</Text>
                <Text style={styles.sessionText}>{profile?.email || 'Cuenta Google conectada'}</Text>
                <Text style={styles.sessionRole}>Perfil creado como cliente.</Text>
              </View>
            ) : null}

            <InputField
              autoCapitalize="none"
              autoComplete="email"
              icon="@"
              inputMode="email"
              onChangeText={setEmail}
              placeholder="usuario@correo.com"
              value={email}
            />

            <InputField
              autoCapitalize="none"
              autoComplete="password"
              icon="*"
              isSecureVisible={isPasswordVisible}
              onChangeText={setPassword}
              onTogglePress={() => setIsPasswordVisible((value) => !value)}
              placeholder="Contrasena"
              secureTextEntry={!isPasswordVisible}
              showToggle
              value={password}
            />

            <Text style={styles.forgot}>Olvidaste tu contrasena?</Text>

            <PrimaryButton
              disabled={!email || !password || isSignedIn}
              label="Iniciar sesion"
            />

            <View style={styles.separatorRow}>
              <View style={styles.separator} />
              <Text style={styles.separatorText}>o continua con</Text>
              <View style={styles.separator} />
            </View>

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <View style={styles.socialRow}>
              <SocialButton
                disabled={isSignedIn}
                icon="G"
                label={isSignedIn ? 'Google conectado' : 'Google'}
                loading={isAuthLoading}
                onPress={onGooglePress}
              />
            </View>

            {isSignedIn ? (
              <PrimaryButton label="Cerrar sesion" onPress={onSignOutPress} />
            ) : null}

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>No tienes cuenta?</Text>
              <Text style={styles.registerAction}> Registrate con Google</Text>
            </View>
          </View>

          <Image source={steppedPattern} resizeMode="contain" style={styles.stairs} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  sideRail: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 16,
  },
  blueRail: {
    backgroundColor: colors.blue,
    height: 92,
    width: 16,
  },
  blackRail: {
    backgroundColor: colors.graphite,
    height: 220,
    width: 16,
  },
  mintRail: {
    backgroundColor: colors.mint,
    height: 60,
    width: 16,
  },
  greyRail: {
    backgroundColor: colors.coolGrey,
    flex: 1,
    width: 16,
  },
  topGlow: {
    backgroundColor: colors.blueGlow,
    borderBottomLeftRadius: 180,
    height: 220,
    position: 'absolute',
    right: -48,
    top: -28,
    width: 220,
  },
  bottomGlow: {
    backgroundColor: colors.mintGlow,
    borderRadius: 180,
    bottom: -78,
    height: 210,
    left: -70,
    position: 'absolute',
    width: 210,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    height: 178,
    width: 214,
  },
  logoDivider: {
    flexDirection: 'row',
    marginTop: 10,
  },
  logoDividerMint: {
    backgroundColor: colors.mint,
    borderBottomLeftRadius: 3,
    borderTopLeftRadius: 3,
    height: 5,
    width: 22,
  },
  logoDividerBlue: {
    backgroundColor: colors.blue,
    borderBottomRightRadius: 3,
    borderTopRightRadius: 3,
    height: 5,
    width: 22,
  },
  headlineBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.graphite,
    fontFamily: typography.display,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  formBlock: {
    gap: spacing.md,
  },
  forgot: {
    alignSelf: 'flex-end',
    color: colors.blue,
    fontFamily: typography.bodyBold,
    fontSize: 14,
    marginTop: -4,
  },
  separatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  separator: {
    backgroundColor: colors.coolGrey,
    flex: 1,
    height: 1,
  },
  separatorText: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorText: {
    color: '#B42318',
    fontFamily: typography.bodyBold,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: colors.smoke,
    borderColor: colors.coolGrey,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  sessionTitle: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 16,
  },
  sessionText: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 14,
    marginTop: 4,
  },
  sessionRole: {
    color: colors.blue,
    fontFamily: typography.bodyBold,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  registerText: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 14,
  },
  registerAction: {
    color: colors.blue,
    fontFamily: typography.bodyBold,
    fontSize: 14,
  },
  stairs: {
    bottom: 22,
    height: 240,
    opacity: 0.22,
    position: 'absolute',
    right: -12,
    width: 240,
  },
});
