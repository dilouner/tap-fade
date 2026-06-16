import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../shared/theme';

export function AppShell() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <View style={styles.logoShape}>
              <Text style={styles.logoText}>TF</Text>
            </View>
            <Text style={styles.brandName}>Tap<Text style={styles.brandAccent}>Fade</Text></Text>
            <View style={styles.brandRule} />
            <Text style={styles.brandCaption}>Agenda precisa para barberias contemporaneas</Text>
          </View>

          <View style={styles.authPanel}>
            <View style={styles.panelAccentRow}>
              <View style={[styles.panelAccent, styles.panelAccentBlue]} />
              <View style={[styles.panelAccent, styles.panelAccentMint]} />
              <View style={[styles.panelAccent, styles.panelAccentGrey]} />
              <View style={[styles.panelAccent, styles.panelAccentDark]} />
            </View>

            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>Inicia sesion para gestionar o reservar tu proximo corte.</Text>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Correo electronico</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="usuario@correo.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Contrasena</Text>
                  <Text style={styles.linkText}>Recuperar</Text>
                </View>
                <TextInput
                  autoCapitalize="none"
                  placeholder="********"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Iniciar sesion</Text>
              </Pressable>
            </View>

            <View style={styles.separatorRow}>
              <View style={styles.separator} />
              <Text style={styles.separatorText}>o continua con</Text>
              <View style={styles.separator} />
            </View>

            <View style={styles.socialRow}>
              <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
                <Text style={styles.googleMark}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
                <Text style={styles.appleMark}>Apple</Text>
              </Pressable>
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>No tienes cuenta?</Text>
              <Text style={styles.registerAction}> Registrate</Text>
            </View>
          </View>

          <View style={styles.stairPattern}>
            <View style={[styles.step, styles.stepOne]} />
            <View style={[styles.step, styles.stepTwo]} />
            <View style={[styles.step, styles.stepThree]} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.graphite,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoShape: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    height: 76,
    justifyContent: 'center',
    marginBottom: spacing.md,
    transform: [{ skewX: '-10deg' }],
    width: 76,
  },
  logoText: {
    color: colors.blue,
    fontFamily: typography.display,
    fontSize: 30,
    fontWeight: '900',
    transform: [{ skewX: '10deg' }],
  },
  brandName: {
    color: colors.surface,
    fontFamily: typography.display,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
  brandAccent: {
    color: colors.blue,
  },
  brandRule: {
    backgroundColor: colors.mint,
    height: 3,
    marginTop: spacing.sm,
    width: 34,
  },
  brandCaption: {
    color: colors.mint,
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  authPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 410,
    overflow: 'hidden',
    padding: spacing.xl,
    width: '100%',
  },
  panelAccentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  panelAccent: {
    height: 9,
    transform: [{ skewX: '-28deg' }],
    width: 34,
  },
  panelAccentBlue: {
    backgroundColor: colors.blue,
  },
  panelAccentMint: {
    backgroundColor: colors.mint,
  },
  panelAccentGrey: {
    backgroundColor: colors.coolGrey,
  },
  panelAccentDark: {
    backgroundColor: colors.graphite,
  },
  title: {
    color: colors.graphite,
    fontFamily: typography.display,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 30,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.steel,
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '800',
  },
  linkText: {
    color: colors.blue,
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.smoke,
    borderColor: colors.coolGrey,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.graphite,
    fontFamily: typography.body,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 7,
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: {
    opacity: 0.82,
  },
  primaryButtonText: {
    color: colors.surface,
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  separatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  separator: {
    backgroundColor: colors.coolGrey,
    flex: 1,
    height: 1,
  },
  separatorText: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    alignItems: 'center',
    borderColor: colors.coolGrey,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
  },
  googleMark: {
    color: colors.blue,
    fontFamily: typography.body,
    fontSize: 16,
    fontWeight: '900',
  },
  appleMark: {
    color: colors.graphite,
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '900',
  },
  socialLabel: {
    color: colors.graphite,
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '800',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 13,
  },
  registerAction: {
    color: colors.blue,
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '900',
  },
  stairPattern: {
    height: 72,
    marginTop: spacing.xl,
    width: 120,
  },
  step: {
    borderColor: colors.mint,
    borderRightWidth: 2,
    borderTopWidth: 2,
    position: 'absolute',
  },
  stepOne: {
    bottom: 0,
    height: 24,
    left: 0,
    width: 40,
  },
  stepTwo: {
    bottom: 24,
    height: 24,
    left: 40,
    width: 40,
  },
  stepThree: {
    bottom: 48,
    height: 24,
    left: 80,
    width: 40,
  },
});
