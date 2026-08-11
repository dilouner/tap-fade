import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { geohashForLocation } from 'geofire-common';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useAppData } from '../AppContext';
import type { RootStackParamList } from '../navigationTypes';
import { AppointmentCard, Banner, BarberCard, EmptyState, LoadingState, PremiumHero, Screen, SectionHeader, ServiceCard } from '../../shared/components/AppUI';
import { DateField, Field, SelectField, TimeField } from '../../shared/components/FormControls';
import { PrimaryButton } from '../../shared/components/PrimaryButton';
import { colors, spacing, typography } from '../../shared/theme';
import { createBarberAvailability, deleteBarberAvailability } from '../../modules/availability/availabilityRepository';
import type { AvailabilityBlock, DayOfWeek } from '../../modules/availability/types';
import { createBusinessOnboarding, createShopBarber, updateBarberShop, updateShopBarber } from '../../modules/barber-shops/barberShopRepository';
import { createBarberInvite, acceptBarberInvite } from '../../modules/barber-shops/inviteRepository';
import { isValidBarber, isValidBarberShop } from '../../modules/barber-shops/barberShop';
import { createShopService, updateShopService } from '../../modules/services/serviceRepository';
import { isValidService } from '../../modules/services/serviceCatalog';
import { useAuth } from '../../modules/auth/AuthProvider';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
const days: { label: string; value: DayOfWeek }[] = [
  { label: 'Dom', value: 0 }, { label: 'Lun', value: 1 }, { label: 'Mar', value: 2 }, { label: 'Mié', value: 3 }, { label: 'Jue', value: 4 }, { label: 'Vie', value: 5 }, { label: 'Sáb', value: 6 },
];

export function OwnerDashboardScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  if (!data.activeShop) return <Screen eyebrow="Negocio" title="Abre tu barbería"><PremiumHero eyebrow="Dueño TapFade" subtitle="Configura negocio, primer servicio, equipo y horario en unos minutos." title="Todo listo para recibir solicitudes." /><PrimaryButton label="Crear mi barbería" onPress={() => navigation.navigate('BusinessEdit')} /></Screen>;
  const today = new Date().toDateString();
  const todayAppointments = data.appointments.filter((item) => item.startAt.toDateString() === today);
  const pending = data.appointments.filter((item) => item.status === 'pending');
  const revenue = data.appointments.filter((item) => item.status === 'completed').reduce((sum, item) => sum + item.priceSnapshot, 0);
  return <Screen eyebrow="Dueño" title={data.activeShop.name}><PremiumHero eyebrow="Operación de hoy" subtitle={`${pending.length} solicitudes necesitan respuesta.`} title={todayAppointments.length ? `${todayAppointments.length} citas en agenda` : 'Tu agenda está libre'} /><View style={styles.stats}><Stat label="Pendientes" value={String(pending.length)} /><Stat label="Ingresos est." value={revenue.toLocaleString('es-MX', { currency: 'MXN', style: 'currency', maximumFractionDigits: 0 })} /></View><SectionHeader subtitle="Más recientes" title="Solicitudes" />{pending.length ? pending.slice(0, 4).map((item) => <AppointmentCard client={item.clientName} date={item.startAt.toLocaleString('es-MX')} key={item.id} onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id, source: 'operator' })} service={item.serviceName} status={item.status} />) : <EmptyState icon="checkmark-done-outline" message="No hay solicitudes esperando respuesta." title="Todo al día" />}</Screen>;
}

export function OperatorAgendaScreen({ source = 'operator' }: { source?: 'admin' | 'operator' }) {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading } = useAppData();
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'pending'>('today');
  if (loading) return <LoadingState />;
  const now = new Date();
  const appointments = [...data.appointments].filter((item) => filter === 'today' ? item.startAt.toDateString() === now.toDateString() : filter === 'pending' ? item.status === 'pending' : item.startAt >= now).sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
  return <Screen eyebrow="Agenda" title="Citas"><SelectField label="" onChange={setFilter} options={[{ label: 'Hoy', value: 'today' }, { label: 'Próximas', value: 'upcoming' }, { label: 'Pendientes', value: 'pending' }]} value={filter} />{appointments.length ? appointments.map((item) => <AppointmentCard client={item.clientName} date={item.startAt.toLocaleString('es-MX')} key={item.id} onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id, source })} service={item.serviceName} status={item.status} />) : <EmptyState message="No hay citas para este filtro." title="Agenda libre" />}</Screen>;
}

export function BusinessScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  if (!data.activeShop) return <Screen eyebrow="Negocio" title="Tu barbería"><EmptyState action={<PrimaryButton label="Completar alta" onPress={() => navigation.navigate('BusinessEdit')} />} icon="business-outline" message="Configura la información mínima para publicar inmediatamente." title="Aún no tienes negocio" /></Screen>;
  return <Screen eyebrow="Negocio" title={data.activeShop.name}><PremiumHero eyebrow="Publicado" subtitle={data.activeShop.address} title="Tu escaparate está activo." /><Menu icon="create-outline" label="Información y ubicación" onPress={() => navigation.navigate('BusinessEdit')} value="Editar" /><SectionHeader action={<Pressable onPress={() => navigation.navigate('ServiceEdit')}><Text style={styles.link}>Agregar</Text></Pressable>} title="Servicios" />{data.services.map((item) => <ServiceCard duration={item.durationMinutes} key={item.id} name={item.name} onPress={() => navigation.navigate('ServiceEdit', { serviceId: item.id })} price={item.price} />)}<SectionHeader action={<Pressable onPress={() => navigation.navigate('BarberEdit')}><Text style={styles.link}>Agregar</Text></Pressable>} title="Equipo" />{data.barbers.map((item) => <BarberCard key={item.id} name={item.displayName} onPress={() => navigation.navigate('BarberEdit', { barberId: item.id })} specialties={item.specialties} />)}<Menu icon="time-outline" label="Disponibilidad y bloqueos" onPress={() => navigation.navigate('AvailabilityEdit')} value={`${data.availability.length}`} /></Screen>;
}

export function BusinessEditScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'BusinessEdit'>) {
  const { data, profile, refresh } = useAppData();
  const auth = useAuth();
  const shop = data.activeShop;
  const [name, setName] = useState(shop?.name ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [address, setAddress] = useState(shop?.address ?? '');
  const [location, setLocation] = useState(shop?.location ?? null);
  const [serviceName, setServiceName] = useState('Corte clásico');
  const [price, setPrice] = useState('250');
  const [barberName, setBarberName] = useState(profile?.displayName ?? '');
  const [ownerWorksHere, setOwnerWorksHere] = useState(false);
  const [startTime, setStartTime] = useState(() => timeDate('09:00'));
  const [endTime, setEndTime] = useState(() => timeDate('18:00'));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function locate() {
    setMessage(null);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === 'granted') {
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ geohash: geohashForLocation([result.coords.latitude, result.coords.longitude]), latitude: result.coords.latitude, longitude: result.coords.longitude });
      return;
    }
    const results = await Location.geocodeAsync(address);
    const first = results[0];
    if (first) setLocation({ geohash: geohashForLocation([first.latitude, first.longitude]), latitude: first.latitude, longitude: first.longitude });
    else setMessage('No pudimos ubicar la dirección. Activa ubicación o revisa el texto.');
  }

  async function save() {
    if (!profile) return;
    const input = { address, description, location, name, ownerId: profile.uid, timezone: 'America/Chihuahua' };
    if (!isValidBarberShop(input) || !location) { setMessage('Completa nombre, dirección y confirma la ubicación.'); return; }
    setSaving(true); setMessage(null);
    try {
      if (shop) await updateBarberShop({ ...shop, address, description, location, name });
      else {
        const serviceInput = { barberShopId: 'pending', durationMinutes: 45, name: serviceName, price: Number(price) };
        if (!isValidService(serviceInput) || barberName.trim().length < 2 || formatTime(startTime) >= formatTime(endTime)) throw new Error('Revisa servicio, precio, barbero y horario.');
        await createBusinessOnboarding({ shop: input, ownerProfile: profile, serviceName, servicePrice: Number(price), barberName, ownerWorksHere, startTime: formatTime(startTime), endTime: formatTime(endTime) });
        await auth.refreshProfile();
      }
      await refresh(); navigation.goBack();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'No fue posible guardar el negocio.'); }
    finally { setSaving(false); }
  }
  return <Screen eyebrow="Alta de negocio" title={shop ? 'Editar barbería' : 'Publica tu barbería'}><Field label="Nombre" onChangeText={setName} value={name} /><Field label="Descripción" multiline onChangeText={setDescription} value={description} /><Field label="Dirección completa" onChangeText={setAddress} value={address} /><PrimaryButton icon="location-outline" label={location ? 'Ubicación confirmada' : 'Confirmar ubicación'} onPress={() => void locate()} variant="secondary" />{!shop ? <><SectionHeader subtitle="Datos iniciales editables después" title="Primer servicio" /><Field label="Servicio" onChangeText={setServiceName} value={serviceName} /><Field keyboardType="decimal-pad" label="Precio MXN" onChangeText={setPrice} value={price} /><SectionHeader title="Primer barbero" /><Field label="Nombre" onChangeText={setBarberName} value={barberName} /><SelectField label="¿Tú también atenderás citas?" onChange={(value) => setOwnerWorksHere(value === 'yes')} options={[{ label: 'No, es parte del equipo', value: 'no' }, { label: 'Sí, soy este barbero', value: 'yes' }]} value={ownerWorksHere ? 'yes' : 'no'} /><TimeField date={startTime} label="Abre" onChange={setStartTime} /><TimeField date={endTime} label="Cierra" onChange={setEndTime} /></> : null}{message ? <Banner message={message} tone="danger" /> : null}<PrimaryButton label={shop ? 'Guardar cambios' : 'Publicar ahora'} loading={saving} onPress={() => void save()} /></Screen>;
}

export function ServiceEditScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'ServiceEdit'>) {
  const { data, refresh } = useAppData();
  const service = data.services.find((item) => item.id === route.params?.serviceId);
  const [name, setName] = useState(service?.name ?? ''); const [price, setPrice] = useState(String(service?.price ?? 250)); const [duration, setDuration] = useState(String(service?.durationMinutes ?? 45)); const [active, setActive] = useState(service?.active ?? true); const [message, setMessage] = useState<string | null>(null);
  async function save() { if (!data.activeShop) return; const input = { barberShopId: data.activeShop.id, durationMinutes: Number(duration), name, price: Number(price) }; if (!isValidService(input)) { setMessage('Revisa nombre, precio y duración.'); return; } if (service) await updateShopService({ ...service, ...input, active }); else await createShopService(input); await refresh(); navigation.goBack(); }
  return <Screen eyebrow="Negocio" title={service ? 'Editar servicio' : 'Nuevo servicio'}><Field label="Nombre" onChangeText={setName} value={name} /><Field keyboardType="decimal-pad" label="Precio MXN" onChangeText={setPrice} value={price} /><SelectField label="Duración" onChange={setDuration} options={['15','30','45','60','90','120','180'].map((value) => ({ label: `${value} min`, value }))} value={duration} /><SelectField label="Estado" onChange={(value) => setActive(value === 'active')} options={[{ label: 'Activo', value: 'active' }, { label: 'Pausado', value: 'paused' }]} value={active ? 'active' : 'paused'} />{message ? <Banner message={message} tone="danger" /> : null}<PrimaryButton label="Guardar servicio" onPress={() => void save()} /></Screen>;
}

export function BarberEditScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'BarberEdit'>) {
  const { data, refresh } = useAppData(); const barber = data.barbers.find((item) => item.id === route.params?.barberId); const [name, setName] = useState(barber?.displayName ?? ''); const [specialties, setSpecialties] = useState(barber?.specialties.join(', ') ?? ''); const [serviceIds, setServiceIds] = useState(barber?.serviceIds ?? []); const [active, setActive] = useState(barber?.active ?? true); const [message, setMessage] = useState<string | null>(null);
  async function save() { if (!data.activeShop) return; const input = { barberShopId: data.activeShop.id, displayName: name, serviceIds, specialties: specialties.split(',').map((item) => item.trim()).filter(Boolean), userId: barber?.userId ?? null }; if (!isValidBarber(input)) { setMessage('Escribe un nombre válido.'); return; } if (barber) await updateShopBarber({ ...barber, active, ...input }); else await createShopBarber(input); await refresh(); navigation.goBack(); }
  function toggleService(id: string) { setServiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  return <Screen eyebrow="Equipo" title={barber ? 'Editar barbero' : 'Nuevo barbero'}><Field label="Nombre" onChangeText={setName} value={name} /><Field label="Especialidades" onChangeText={setSpecialties} placeholder="Fade, barba, clásico" value={specialties} /><Text style={styles.fieldLabel}>Servicios que realiza</Text><View style={styles.chips}>{data.services.map((item) => <Pressable key={item.id} onPress={() => toggleService(item.id)} style={[styles.chip, serviceIds.includes(item.id) && styles.chipActive]}><Text style={[styles.chipText, serviceIds.includes(item.id) && styles.chipTextActive]}>{item.name}</Text></Pressable>)}</View><SelectField label="Estado" onChange={(value) => setActive(value === 'active')} options={[{ label: 'Activo', value: 'active' }, { label: 'Pausado', value: 'paused' }]} value={active ? 'active' : 'paused'} />{message ? <Banner message={message} tone="danger" /> : null}<PrimaryButton label="Guardar barbero" onPress={() => void save()} />{barber ? <PrimaryButton label="Crear código de invitación" onPress={() => navigation.navigate('InviteBarber', { barberId: barber.id })} variant="secondary" /> : null}</Screen>;
}

export function AvailabilityEditScreen() {
  const { data, mode, refresh } = useAppData();
  const initialBarberId = mode === 'barber' ? data.activeBarber?.id ?? '' : data.barbers[0]?.id ?? '';
  const [barberId, setBarberId] = useState(initialBarberId); const [day, setDay] = useState<DayOfWeek>(1); const [kind, setKind] = useState<'weekly' | 'exception'>('weekly'); const [blocked, setBlocked] = useState(false); const [date, setDate] = useState(new Date()); const [start, setStart] = useState(timeDate('09:00')); const [end, setEnd] = useState(timeDate('18:00')); const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const selectedBarberId = barberId || (mode === 'barber' ? data.activeBarber?.id : data.barbers[0]?.id) || '';
  const shown = data.availability.filter((item) => item.barberId === selectedBarberId);
  async function save() {
    setMessage(null);
    if (!data.activeShop) { setMessage('No encontramos el negocio vinculado.'); return; }
    if (!selectedBarberId) { setMessage('Selecciona un barbero antes de agregar el intervalo.'); return; }
    setSaving(true);
    try {
      await createBarberAvailability({ barberId: selectedBarberId, barberShopId: data.activeShop.id, blocked, date: kind === 'exception' ? localDate(date) : null, dayOfWeek: day, endTime: formatTime(end), kind, reason, startTime: formatTime(start) });
      await refresh(); setMessage('Intervalo agregado correctamente.');
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'No fue posible agregar el intervalo.'); }
    finally { setSaving(false); }
  }
  async function remove(item: AvailabilityBlock) {
    setMessage(null);
    try { await deleteBarberAvailability(item); await refresh(); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : 'No fue posible eliminar el intervalo.'); }
  }
  return <Screen eyebrow="Agenda" title="Disponibilidad">{mode === 'owner' ? <SelectField label="Barbero" onChange={setBarberId} options={data.barbers.map((item) => ({ label: item.displayName, value: item.id }))} value={selectedBarberId} /> : null}<SelectField label="Tipo" onChange={setKind} options={[{ label: 'Horario semanal', value: 'weekly' }, { label: 'Excepción por fecha', value: 'exception' }]} value={kind} />{kind === 'weekly' ? <SelectField label="Día" onChange={(value) => setDay(Number(value) as DayOfWeek)} options={days.map((item) => ({ label: item.label, value: String(item.value) }))} value={String(day)} /> : <DateField date={date} label="Fecha" onChange={setDate} />}<SelectField label="Disponibilidad" onChange={(value) => setBlocked(value === 'blocked')} options={[{ label: 'Disponible', value: 'open' }, { label: 'Bloqueo', value: 'blocked' }]} value={blocked ? 'blocked' : 'open'} /><TimeField date={start} label="Inicio" onChange={setStart} /><TimeField date={end} label="Fin" onChange={setEnd} />{blocked ? <Field label="Motivo" onChangeText={setReason} value={reason} /> : null}{message ? <Banner message={message} tone={message.includes('correctamente') ? 'success' : 'danger'} /> : null}<PrimaryButton disabled={!selectedBarberId} label="Agregar intervalo" loading={saving} onPress={() => void save()} /><SectionHeader title="Intervalos configurados" />{shown.length ? shown.map((item) => <View key={item.id} style={styles.block}><View style={styles.flex}><Text style={styles.cardTitle}>{item.kind === 'weekly' ? days.find((dayItem) => dayItem.value === item.dayOfWeek)?.label : item.date} · {item.startTime}–{item.endTime}</Text><Text style={styles.muted}>{item.blocked ? `Bloqueo · ${item.reason || 'Sin motivo'}` : 'Disponible'}</Text></View><Pressable accessibilityLabel="Eliminar intervalo" accessibilityRole="button" onPress={() => void remove(item)}><Ionicons color={colors.danger} name="trash-outline" size={20} /></Pressable></View>) : <EmptyState message="Agrega el primer intervalo para abrir agenda." title="Sin horarios" />}</Screen>;
}

export function InviteBarberScreen({ route }: NativeStackScreenProps<RootStackParamList, 'InviteBarber'>) {
  const { data, profile } = useAppData(); const barber = data.barbers.find((item) => item.id === route.params.barberId); const [code, setCode] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  async function create() { if (!data.activeShop || !barber || !profile || saving) return; setSaving(true); setMessage(null); try { const result = await createBarberInvite(data.activeShop.id, barber.id, profile.uid); setCode(result.code); } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'No fue posible crear la invitación.'); } finally { setSaving(false); } }
  if (!barber || !data.activeShop || !profile) return <Screen eyebrow="Equipo" title="Invitación"><EmptyState icon="alert-circle-outline" message="Vuelve al equipo y selecciona un barbero disponible." title="No encontramos este perfil" /></Screen>;
  return <Screen eyebrow="Equipo" title={`Invitar a ${barber.displayName}`}><PremiumHero eyebrow="Código seguro" subtitle="Vence en siete días y solo puede utilizarse una vez." title={code ?? 'Genera un código para vincular su cuenta.'} />{message ? <Banner message={message} tone="danger" /> : null}<PrimaryButton label={code ? 'Compartir código' : 'Generar código'} loading={saving} onPress={() => code ? void Share.share({ message: `Únete a ${data.activeShop!.name} en TapFade con el código ${code}` }) : void create()} /></Screen>;
}

export function RedeemInviteScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'RedeemInvite'>) { const { profile } = useAppData(); const auth = useAuth(); const [code, setCode] = useState(''); const [message, setMessage] = useState<string | null>(null); async function accept() { if (!profile) return; try { await acceptBarberInvite(code, profile.uid); await auth.refreshProfile(); navigation.goBack(); } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'No fue posible aceptar el código.'); } } return <Screen eyebrow="Equipo" title="Unirme como barbero"><Field autoCapitalize="characters" label="Código de invitación" onChangeText={setCode} value={code} />{message ? <Banner message={message} tone="danger" /> : null}<PrimaryButton label="Aceptar invitación" onPress={() => void accept()} /></Screen>; }

function Menu({ icon, label, onPress, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; value: string }) { return <Pressable onPress={onPress} style={styles.menu}><View style={styles.menuIcon}><Ionicons color={colors.blue} name={icon} size={21} /></View><Text style={[styles.cardTitle, styles.flex]}>{label}</Text><Text style={styles.muted}>{value}</Text><Ionicons color={colors.muted} name="chevron-forward" size={18} /></Pressable>; }
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.muted}>{label}</Text></View>; }
function timeDate(value: string) { const [hours, minutes] = value.split(':').map(Number); const date = new Date(); date.setHours(hours, minutes, 0, 0); return date; }
function formatTime(date: Date) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

const styles = StyleSheet.create({
  block: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', gap: spacing.md, padding: spacing.lg }, cardTitle: { color: colors.graphite, fontFamily: typography.bodyBlack, fontSize: 15 }, chip: { borderColor: colors.coolGrey, borderRadius: 14, borderWidth: 1, padding: spacing.md }, chipActive: { backgroundColor: colors.graphite }, chipText: { color: colors.steel, fontFamily: typography.bodyBold }, chipTextActive: { color: colors.surface }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, fieldLabel: { color: colors.graphite, fontFamily: typography.bodyBold, fontSize: 13 }, flex: { flex: 1 }, link: { color: colors.blue, fontFamily: typography.bodyBold }, menu: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, flexDirection: 'row', gap: spacing.md, minHeight: 68, padding: spacing.md }, menuIcon: { alignItems: 'center', backgroundColor: colors.blueGlow, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 }, muted: { color: colors.muted, fontFamily: typography.body, fontSize: 13 }, stat: { backgroundColor: colors.surface, borderRadius: 20, flex: 1, gap: spacing.xs, padding: spacing.lg }, stats: { flexDirection: 'row', gap: spacing.md }, statValue: { color: colors.graphite, fontFamily: typography.displayBold, fontSize: 22 },
});
