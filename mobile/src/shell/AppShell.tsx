import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InputField } from '../shared/components/InputField';
import { PrimaryButton } from '../shared/components/PrimaryButton';
import { SocialButton } from '../shared/components/SocialButton';
import { colors, spacing, typography } from '../shared/theme';

const tapFadeLogo = require('../../assets/logo-primary-stacked-color-trimmed.png');
const steppedPattern = require('../../assets/brand-pattern-stepped-light.png');

type AppShellProps = {
  authError?: string | null;
  initialMode?: 'signin' | 'signup';
  onEmailPress: (email: string, password: string) => Promise<void>;
  onGooglePress: () => Promise<void>;
  onRegisterPress: (name: string, email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onBack?: () => void;
};

export function AppShell({ authError, initialMode = 'signin', onBack, onEmailPress, onGooglePress, onRegisterPress, onResetPassword }: AppShellProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setNotice(null);
    if (!email.trim() || password.length < 8) { setNotice('Escribe tu correo y una contraseña de al menos 8 caracteres.'); return; }
    if (mode === 'signup' && name.trim().length < 2) { setNotice('Escribe tu nombre.'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') await onRegisterPress(name.trim(), email.trim(), password);
      else await onEmailPress(email.trim(), password);
    } finally { setLoading(false); }
  }

  async function resetPassword() {
    if (!email.trim()) { setNotice('Escribe primero tu correo.'); return; }
    setLoading(true); setNotice(null);
    try { await onResetPassword(email.trim()); setNotice('Te enviamos las instrucciones para cambiar tu contraseña.'); }
    catch { setNotice('No fue posible enviar las instrucciones.'); }
    finally { setLoading(false); }
  }

  async function google() {
    if (loading) return;
    setLoading(true); setNotice(null);
    try { await onGooglePress(); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        {onBack ? <Pressable accessibilityLabel="Volver a explorar" accessibilityRole="button" hitSlop={12} onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹ Volver</Text></Pressable> : null}
        <View pointerEvents="none" style={styles.sideRail}><View style={styles.blueRail} /><View style={styles.blackRail} /><View style={styles.mintRail} /><View style={styles.greyRail} /></View>
        <View pointerEvents="none" style={styles.topGlow} />
        <View pointerEvents="none" style={styles.bottomGlow} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}><Image resizeMode="contain" source={tapFadeLogo} style={styles.logo} /><View style={styles.logoDivider}><View style={styles.logoDividerMint} /><View style={styles.logoDividerBlue} /></View></View>
          <View style={styles.headlineBlock}>
            <Text style={styles.title}>{mode === 'signup' ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</Text>
            <Text style={styles.subtitle}>{mode === 'signup' ? 'Empieza a reservar y administrar desde TapFade' : 'Inicia sesión para continuar'}</Text>
          </View>
          <View style={styles.modeSwitch}>
            <Pressable onPress={() => { setMode('signin'); setNotice(null); }} style={[styles.modeOption, mode === 'signin' && styles.modeOptionActive]}><Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>Iniciar sesión</Text></Pressable>
            <Pressable onPress={() => { setMode('signup'); setNotice(null); }} style={[styles.modeOption, mode === 'signup' && styles.modeOptionActive]}><Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Registrarme</Text></Pressable>
          </View>
          <View style={styles.formBlock}>
            {mode === 'signup' ? <InputField autoCapitalize="words" icon="N" onChangeText={setName} placeholder="Nombre completo" value={name} /> : null}
            <InputField autoCapitalize="none" autoComplete="email" icon="@" inputMode="email" onChangeText={setEmail} placeholder="usuario@correo.com" value={email} />
            <InputField autoCapitalize="none" autoComplete="password" icon="*" isSecureVisible={isPasswordVisible} onChangeText={setPassword} onTogglePress={() => setIsPasswordVisible((value) => !value)} placeholder="Contraseña" secureTextEntry={!isPasswordVisible} showToggle value={password} />
            {mode === 'signin' ? <Pressable hitSlop={8} onPress={() => void resetPassword()}><Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text></Pressable> : null}
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
            <PrimaryButton label={mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'} loading={loading} onPress={() => void submit()} />
            <View style={styles.separatorRow}><View style={styles.separator} /><Text style={styles.separatorText}>o continúa con</Text><View style={styles.separator} /></View>
            <SocialButton disabled={loading} icon="G" label="Google" loading={loading} onPress={() => void google()} />
          </View>
          <View pointerEvents="none" style={styles.stairsWrap}><Image resizeMode="contain" source={steppedPattern} style={styles.stairs} /></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.surface, flex: 1 }, keyboard: { flex: 1 },
  backButton: { left: spacing.xl, minHeight: 44, paddingVertical: spacing.sm, position: 'absolute', top: spacing.sm, zIndex: 3 }, backText: { color: colors.blue, fontFamily: typography.bodyBold, fontSize: 15 },
  sideRail: { bottom: 0, left: 0, position: 'absolute', top: 0, width: 14 }, blueRail: { backgroundColor: colors.blue, height: 92, width: 14 }, blackRail: { backgroundColor: colors.graphite, height: 220, width: 14 }, mintRail: { backgroundColor: colors.mint, height: 60, width: 14 }, greyRail: { backgroundColor: colors.coolGrey, flex: 1, width: 14 },
  topGlow: { backgroundColor: colors.blueGlow, borderBottomLeftRadius: 180, height: 220, position: 'absolute', right: -48, top: -28, width: 220 }, bottomGlow: { backgroundColor: colors.mintGlow, borderRadius: 180, bottom: -78, height: 210, left: -70, position: 'absolute', width: 210 },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.xxl, paddingHorizontal: spacing.xxl, paddingTop: spacing.lg },
  logoWrap: { alignItems: 'center', marginBottom: spacing.md }, logo: { height: 148, width: 190 }, logoDivider: { flexDirection: 'row', marginTop: spacing.xs }, logoDividerMint: { backgroundColor: colors.mint, borderBottomLeftRadius: 3, borderTopLeftRadius: 3, height: 5, width: 22 }, logoDividerBlue: { backgroundColor: colors.blue, borderBottomRightRadius: 3, borderTopRightRadius: 3, height: 5, width: 22 },
  headlineBlock: { alignItems: 'center', marginBottom: spacing.lg }, title: { color: colors.graphite, fontFamily: typography.display, fontSize: 27, lineHeight: 34, textAlign: 'center' }, subtitle: { color: colors.muted, fontFamily: typography.body, fontSize: 15, lineHeight: 21, marginTop: spacing.xs, textAlign: 'center' },
  modeSwitch: { backgroundColor: colors.smoke, borderRadius: 16, flexDirection: 'row', marginBottom: spacing.lg, padding: 4 }, modeOption: { alignItems: 'center', borderRadius: 12, flex: 1, minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.sm }, modeOptionActive: { backgroundColor: colors.surface, shadowColor: colors.shadow, shadowOffset: { height: 3, width: 0 }, shadowOpacity: 1, shadowRadius: 8 }, modeText: { color: colors.muted, fontFamily: typography.bodyBold, fontSize: 13 }, modeTextActive: { color: colors.graphite },
  formBlock: { gap: spacing.md, zIndex: 1 }, forgot: { alignSelf: 'flex-end', color: colors.blue, fontFamily: typography.bodyBold, fontSize: 13, textAlign: 'right' }, separatorRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }, separator: { backgroundColor: colors.coolGrey, flex: 1, height: 1 }, separatorText: { color: colors.muted, fontFamily: typography.body, fontSize: 13 },
  errorText: { color: colors.danger, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 18, textAlign: 'center' }, noticeText: { color: colors.blue, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  stairsWrap: { bottom: 8, height: 210, opacity: 0.16, position: 'absolute', right: -20, width: 210, zIndex: 0 }, stairs: { height: 210, width: 210 },
});
