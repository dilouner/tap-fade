import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { addHours, setHours, setMinutes } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Image } from 'expo-image';

import { useAppData } from '../AppContext';
import type { RootStackParamList } from '../navigationTypes';
import { requestAppointmentReschedule, resolveAppointmentReschedule, transitionAppointment } from '../../modules/appointments/appointmentRepository';
import type { AppointmentStatus } from '../../modules/appointments/types';
import { canEditAppointment } from '../../modules/appointments/appointmentRules';
import { markAllNotificationsRead, markNotificationRead } from '../../modules/notifications/notificationRepository';
import { updateOwnProfile } from '../../modules/users/userProfileRepository';
import type { AppMode } from '../../modules/users/types';
import { Banner, EmptyState, Screen, SectionHeader, StatusPill } from '../../shared/components/AppUI';
import { ConfirmationDialog, DateField, Field, SelectField, TimeField } from '../../shared/components/FormControls';
import { PrimaryButton } from '../../shared/components/PrimaryButton';
import { colors, spacing, typography } from '../../shared/theme';
import { AppShell } from '../../shell/AppShell';
import { resolveProfileImage } from '../../shared/assets/demoAssets';

export type AuthActions = {
  deleteAccount: (password?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
};

export function AuthScreen({ actions, error, navigation, route }: NativeStackScreenProps<RootStackParamList, 'Auth'> & { actions: AuthActions; error: string | null }) {
  const { profile } = useAppData();

  React.useEffect(() => {
    if (profile) navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }, [navigation, profile]);

  return <AppShell authError={error} initialMode={route.params?.initialMode} onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Tabs')} onEmailPress={actions.signInEmail} onGooglePress={actions.signInGoogle} onRegisterPress={actions.signUpEmail} onResetPassword={actions.resetPassword} />;
}

type ProfileDestination = 'Auth' | 'BusinessEdit' | 'ProfileEdit' | 'RedeemInvite';

export function ProfileScreen({ actions, onNavigate }: { actions: AuthActions; onNavigate: (destination: ProfileDestination) => void }) {
  const { mode, profile, setMode } = useAppData();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [legalDocument, setLegalDocument] = React.useState<'privacy' | 'terms' | null>(null);
  if (!profile) {
    return (
      <Screen eyebrow="Tu cuenta" title="Perfil">
        <EmptyState action={<PrimaryButton label="Iniciar sesión" onPress={() => onNavigate('Auth')} />} icon="person-circle-outline" message="Inicia sesión para reservar y guardar tu actividad." title="Aún no has iniciado sesión" />
      </Screen>
    );
  }
  return (
    <Screen eyebrow="Tu cuenta" title="Perfil y espacios">
      <View style={styles.profileCard}>
        <Image accessibilityLabel={`Avatar de ${profile.displayName}`} contentFit="cover" source={resolveProfileImage(profile)} style={styles.avatar} transition={200} />
        <View style={styles.flex}><Text style={styles.cardTitle}>{profile.displayName || 'Usuario TapFade'}</Text><Text style={styles.muted}>{profile.email}</Text></View>
      </View>
      <SelectField<AppMode> label="Cambiar espacio" onChange={setMode} options={profile.roles.map((role) => ({ label: roleLabel(role), value: role }))} value={mode} />
      <PrimaryButton label="Editar perfil" onPress={() => onNavigate('ProfileEdit')} variant="secondary" />
      {profile.roles.includes('owner') ? null : <PrimaryButton label="Publicar mi negocio" onPress={() => onNavigate('BusinessEdit')} variant="secondary" />}
      {profile.roles.includes('barber') ? null : <PrimaryButton label="Tengo un código de barbero" onPress={() => onNavigate('RedeemInvite')} variant="secondary" />}
      <PrimaryButton label="Cerrar sesión" onPress={() => void actions.signOut()} variant="secondary" />
      <PrimaryButton label="Eliminar cuenta" onPress={() => setConfirmDelete(true)} variant="ghost" />
      {confirmDelete ? <Field autoCapitalize="none" label="Contraseña actual (cuentas de correo)" onChangeText={setDeletePassword} secureTextEntry value={deletePassword} /> : null}
      {deleteError ? <Banner message={deleteError} tone="danger" /> : null}
      <View style={styles.legalLinks}><Pressable accessibilityRole="link" onPress={() => setLegalDocument('terms')}><Text style={styles.link}>Términos de uso</Text></Pressable><Pressable accessibilityRole="link" onPress={() => setLegalDocument('privacy')}><Text style={styles.link}>Aviso de privacidad</Text></Pressable></View>
      <ConfirmationDialog body="Se cancelarán tus citas activas y se anonimizará el historial. No se puede deshacer." confirmLabel="Eliminar cuenta" destructive onClose={() => setConfirmDelete(false)} onConfirm={() => void actions.deleteAccount(deletePassword).catch((caught) => { setConfirmDelete(false); setDeleteError(caught instanceof Error ? caught.message : 'No fue posible eliminar la cuenta.'); })} title="¿Eliminar tu cuenta?" visible={confirmDelete} />
      <ConfirmationDialog body={legalDocument === 'privacy' ? 'TapFade usa los datos de cuenta, ubicación aproximada y citas únicamente para prestar el servicio. No vende información personal. Puedes editar o eliminar tu cuenta desde este perfil.' : 'TapFade conecta clientes con negocios independientes. Los precios, disponibilidad y prestación del servicio son responsabilidad del negocio. Las cancelaciones requieren al menos una hora de anticipación.'} confirmLabel="Cerrar" onClose={() => setLegalDocument(null)} onConfirm={() => setLegalDocument(null)} title={legalDocument === 'privacy' ? 'Aviso de privacidad' : 'Términos de uso'} visible={Boolean(legalDocument)} />
    </Screen>
  );
}

export function ProfileEditScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>) {
  const { profile, refresh } = useAppData();
  const [name, setName] = React.useState(profile?.displayName ?? '');
  const [phone, setPhone] = React.useState(profile?.phone ?? '');
  if (!profile) return <Screen eyebrow="Cuenta" title="Inicia sesión"><EmptyState icon="person-outline" message="Vuelve al escaparate e inicia sesión para editar tu perfil." title="Perfil no disponible" /></Screen>;
  async function save() {
    if (name.trim().length < 2) return;
    await updateOwnProfile(profile!.uid, { displayName: name, phone: phone || null });
    await refresh();
    navigation.goBack();
  }
  return <Screen eyebrow="Cuenta" title="Editar perfil"><Field label="Nombre" onChangeText={setName} value={name} /><Field keyboardType="phone-pad" label="Teléfono" onChangeText={setPhone} value={phone} /><PrimaryButton label="Guardar cambios" onPress={() => void save()} /></Screen>;
}

export function NotificationsScreen() {
  const { data, profile, refresh } = useAppData();
  if (!profile) return <Screen eyebrow="Actividad" title="Notificaciones"><EmptyState icon="notifications-outline" message="Inicia sesión para consultar tu bandeja." title="Bandeja no disponible" /></Screen>;
  return (
    <Screen eyebrow="Actividad" title="Notificaciones">
      <SectionHeader action={data.notifications.some((item) => !item.readAt) ? <Pressable onPress={() => void markAllNotificationsRead(data.notifications).then(refresh)}><Text style={styles.link}>Marcar todas</Text></Pressable> : null} subtitle={`${data.notifications.filter((item) => !item.readAt).length} sin leer`} title="Tu bandeja" />
      {data.notifications.length === 0 ? <EmptyState icon="notifications-outline" message="Aquí aparecerán cambios de citas e invitaciones." title="Todo al día" /> : data.notifications.map((item) => (
        <Pressable key={item.id} onPress={() => void markNotificationRead(profile.uid, item.id).then(refresh)} style={[styles.notification, !item.readAt && styles.notificationUnread]}>
          <View style={styles.notificationIcon}><Ionicons color={colors.blue} name="notifications-outline" size={20} /></View>
          <View style={styles.flex}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.muted}>{item.body}</Text><Text style={styles.time}>{item.createdAt.toLocaleString('es-MX')}</Text></View>
        </Pressable>
      ))}
    </Screen>
  );
}

export function AppointmentDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'AppointmentDetail'>) {
  const { data, profile, refresh } = useAppData();
  const appointments = route.params.source === 'client' ? data.clientAppointments : data.appointments;
  const appointment = appointments.find((item) => item.id === route.params.appointmentId);
  const [newDate, setNewDate] = React.useState(() => addHours(new Date(), 24));
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  if (!appointment || !profile) return <Screen title="Cita"><EmptyState message="No encontramos esta cita." title="Cita no disponible" /></Screen>;

  async function changeStatus(status: AppointmentStatus) {
    setActionLoading(true); setActionError(null);
    try { await transitionAppointment(appointment!, status, profile!.uid); await refresh(); navigation.goBack(); }
    catch (caught) { setActionError(caught instanceof Error ? caught.message : 'No fue posible actualizar la cita.'); }
    finally { setActionLoading(false); }
  }

  async function requestReschedule() {
    setActionLoading(true); setActionError(null);
    try { await requestAppointmentReschedule(appointment!, newDate, profile!.uid); await refresh(); }
    catch (caught) { setActionError(caught instanceof Error ? caught.message : 'No fue posible solicitar el cambio.'); }
    finally { setActionLoading(false); }
  }

  async function resolveReschedule(accept: boolean) {
    setActionLoading(true); setActionError(null);
    try { await resolveAppointmentReschedule(appointment!, accept, profile!.uid); await refresh(); }
    catch (caught) { setActionError(caught instanceof Error ? caught.message : 'No fue posible responder al cambio.'); }
    finally { setActionLoading(false); }
  }

  const editable = canEditAppointment(appointment);

  return (
    <Screen eyebrow="Detalle" title={appointment.serviceName}>
      <View style={styles.summary}><Summary label="Barbero" value={appointment.barberName} /><Summary label="Fecha" value={appointment.startAt.toLocaleString('es-MX')} /><Summary label="Precio" value={appointment.priceSnapshot.toLocaleString('es-MX', { currency: 'MXN', style: 'currency' })} /><StatusPill status={appointment.status} /></View>
      {appointment.rescheduleRequest ? <Banner message={`Cambio solicitado para ${appointment.rescheduleRequest.startAt.toLocaleString('es-MX')}`} /> : null}
      {actionError ? <Banner message={actionError} tone="danger" /> : null}
      {route.params.source === 'client' && ['pending', 'confirmed'].includes(appointment.status) && editable ? <>
        <SectionHeader title="Solicitar otro horario" subtitle="Tu cita actual se conserva hasta que acepten el cambio." />
        <DateField date={newDate} label="Nueva fecha" onChange={(date) => setNewDate(setHours(setMinutes(date, newDate.getMinutes()), newDate.getHours()))} />
        <TimeField date={newDate} label="Nueva hora" onChange={(date) => setNewDate(setHours(setMinutes(newDate, date.getMinutes()), date.getHours()))} />
        <PrimaryButton disabled={Boolean(appointment.rescheduleRequest)} label="Solicitar cambio" loading={actionLoading} onPress={() => void requestReschedule()} />
        <PrimaryButton label="Cancelar cita" onPress={() => setConfirmCancel(true)} variant="ghost" />
      </> : route.params.source === 'client' && ['pending', 'confirmed'].includes(appointment.status) ? <Banner message="La cita ya está dentro de la última hora y no admite cambios." /> : null}
      {route.params.source !== 'client' && appointment.status === 'pending' ? <View style={styles.actions}><PrimaryButton label="Rechazar" onPress={() => void changeStatus('rejected')} variant="secondary" /><PrimaryButton label="Confirmar" onPress={() => void changeStatus('confirmed')} /></View> : null}
      {route.params.source !== 'client' && appointment.rescheduleRequest ? <View style={styles.actions}><PrimaryButton label="Rechazar cambio" loading={actionLoading} onPress={() => void resolveReschedule(false)} variant="secondary" /><PrimaryButton label="Aceptar cambio" loading={actionLoading} onPress={() => void resolveReschedule(true)} /></View> : null}
      {route.params.source !== 'client' && appointment.status === 'confirmed' && appointment.endAt <= new Date() ? <PrimaryButton label="Marcar completada" loading={actionLoading} onPress={() => void changeStatus('completed')} /> : null}
      <ConfirmationDialog body="El horario quedará disponible para otros clientes." confirmLabel="Cancelar cita" destructive onClose={() => setConfirmCancel(false)} onConfirm={() => void changeStatus('cancelled')} title="¿Cancelar esta cita?" visible={confirmCancel} />
    </Screen>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <View style={styles.summaryRow}><Text style={styles.muted}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>; }
function roleLabel(role: AppMode) { return ({ admin: 'Administración', barber: 'Barbero', client: 'Cliente', owner: 'Dueño' } as const)[role]; }

const styles = StyleSheet.create({
  actions: { gap: spacing.sm }, avatar: { alignItems: 'center', backgroundColor: colors.blue, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 }, avatarText: { color: colors.surface, fontFamily: typography.displayBold, fontSize: 20 },
  cardTitle: { color: colors.graphite, fontFamily: typography.bodyBlack, fontSize: 16 }, flex: { flex: 1, gap: spacing.xs }, legalLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }, link: { color: colors.blue, fontFamily: typography.bodyBold, fontSize: 13 },
  muted: { color: colors.muted, fontFamily: typography.body, fontSize: 14, lineHeight: 20 }, notification: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.coolGrey, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.lg }, notificationIcon: { alignItems: 'center', backgroundColor: colors.blueGlow, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 }, notificationUnread: { borderColor: colors.blue, borderWidth: 2 },
  profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22, flexDirection: 'row', gap: spacing.lg, padding: spacing.lg }, summary: { backgroundColor: colors.surface, borderRadius: 20, gap: spacing.md, padding: spacing.lg }, summaryRow: { borderBottomColor: colors.coolGrey, borderBottomWidth: 1, gap: spacing.xs, paddingBottom: spacing.md }, summaryValue: { color: colors.graphite, fontFamily: typography.bodyBold, fontSize: 16 }, time: { color: colors.muted, fontFamily: typography.body, fontSize: 11 },
});
