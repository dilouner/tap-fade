import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { addDays, format, setHours, setMinutes } from 'date-fns';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppData } from '../AppContext';
import type { RootStackParamList } from '../navigationTypes';
import { createClientAppointment, listBarberOccupiedSlots } from '../../modules/appointments/appointmentRepository';
import { listShopAvailability } from '../../modules/availability/availabilityRepository';
import { getAvailableSlots } from '../../modules/availability/slotGeneration';
import type { AvailabilityBlock } from '../../modules/availability/types';
import { listNearbyActiveBarberShops, listShopBarbers, type NearbyShop } from '../../modules/barber-shops/barberShopRepository';
import type { Barber } from '../../modules/barber-shops/types';
import { listShopServices } from '../../modules/services/serviceRepository';
import type { BarberService } from '../../modules/services/types';
import { setShopFavorite } from '../../modules/favorites/favoriteRepository';
import { resolveBarberImage, resolveShopImage } from '../../shared/assets/demoAssets';
import { AppointmentCard, Banner, EmptyState, LoadingState, PremiumHero, Screen, SectionHeader, ServiceCard, ShopCard, BarberCard, TimeSlotGrid } from '../../shared/components/AppUI';
import { DateField, Field, SelectField } from '../../shared/components/FormControls';
import { PrimaryButton } from '../../shared/components/PrimaryButton';
import { colors, spacing, typography } from '../../shared/theme';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function ClientHomeScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading, profile, refresh } = useAppData();
  const upcoming = [...data.clientAppointments]
    .filter((item) => ['pending', 'confirmed'].includes(item.status) && item.startAt > new Date())
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())[0];
  if (loading) return <LoadingState />;
  return (
    <Screen eyebrow="TapFade" onRefresh={() => void refresh()} refreshing={loading} title={profile ? `Hola, ${profile.displayName.split(' ')[0] || 'bienvenido'}` : 'Tu próximo corte, sin llamadas'}>
      <PremiumHero action={<PrimaryButton disabled={!data.shops[0]} label={data.shops[0] ? 'Ver barbería destacada' : 'Sin barberías disponibles'} onPress={() => data.shops[0] && navigation.navigate('ShopDetail', { shopId: data.shops[0].id })} variant="secondary" />} eyebrow="Reserva local" subtitle="Descubre profesionales cerca, revisa sus servicios y solicita un horario disponible." title="Haz espacio para verte bien." />
      {upcoming ? <><SectionHeader subtitle="Tu cita más cercana" title="Próxima visita" /><AppointmentCard client={upcoming.barberName} date={upcoming.startAt.toLocaleString('es-MX')} onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: upcoming.id, source: 'client' })} service={upcoming.serviceName} status={upcoming.status} /></> : <EmptyState icon="calendar-outline" message="Explora negocios activos y solicita tu primer horario." title={profile ? 'Aún no tienes citas' : 'Explora antes de registrarte'} />}
      {profile && data.favoriteShopIds.length ? <><SectionHeader subtitle="Tus lugares guardados" title="Favoritos" />{data.shops.filter((shop) => data.favoriteShopIds.includes(shop.id)).slice(0, 2).map((shop) => <ShopCard address={shop.address} image={resolveShopImage(shop)} key={shop.id} meta="Guardado en favoritos" name={shop.name} onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })} />)}</> : null}
      <SectionHeader subtitle="Selección TapFade" title="Destacadas" />
      {data.shops.slice(0, 2).map((shop) => <ShopCard address={shop.address} image={resolveShopImage(shop)} key={shop.id} meta="Abierto hoy · Reserva en minutos" name={shop.name} onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })} />)}
      <View style={styles.stats}><Stat icon="business-outline" label="Barberías activas" value={String(data.shops.length)} /><Stat icon="calendar-outline" label="Tus citas" value={String(data.clientAppointments.length)} /></View>
    </Screen>
  );
}

export function ExploreScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, error, loading, online, profile, refresh } = useAppData();
  const [query, setQuery] = useState('');
  const [nearby, setNearby] = useState<NearbyShop[] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  async function requestLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setLocationMessage('Puedes buscar por nombre o zona sin compartir tu ubicación.'); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setNearby(await listNearbyActiveBarberShops([position.coords.latitude, position.coords.longitude]));
    } catch { setLocationMessage('No pudimos obtener tu ubicación. Puedes continuar buscando por zona.'); }
  }

  async function toggleFavorite(shopId: string) {
    if (!profile) { navigation.navigate('Auth'); return; }
    try { await setShopFavorite(profile.uid, shopId, !data.favoriteShopIds.includes(shopId)); }
    catch { Alert.alert('No se pudo guardar', 'Revisa tu conexión e intenta nuevamente.'); }
  }

  const shops = useMemo(() => {
    const source = nearby ?? data.shops.map((shop) => ({ ...shop, distanceKm: null }));
    const needle = query.trim().toLocaleLowerCase('es-MX');
    return source.filter((shop) => !needle || `${shop.name} ${shop.address} ${shop.description}`.toLocaleLowerCase('es-MX').includes(needle));
  }, [data.shops, nearby, query]);
  if (loading) return <LoadingState />;
  return (
    <Screen eyebrow="Explorar" onRefresh={() => void refresh()} refreshing={loading} title="Encuentra tu lugar">
      {!online ? <Banner message="Estás sin conexión. Mostramos la información guardada en el dispositivo." /> : null}
      <Field label="Buscar barbería o zona" onChangeText={setQuery} placeholder="Nombre, colonia o ciudad" value={query} />
      <PrimaryButton icon="location-outline" label={nearby ? 'Ordenadas por distancia' : 'Ver cercanas a mí'} onPress={() => void requestLocation()} variant="secondary" />
      {locationMessage ? <Banner message={locationMessage} /> : null}{error ? <Banner message={error} tone="danger" /> : null}
      <SectionHeader subtitle={`${shops.length} resultados`} title="Barberías" />
      {shops.length === 0 ? <EmptyState icon="search-outline" message="Prueba otra zona o revisa más tarde." title="Sin resultados" /> : shops.map((shop) => <View key={shop.id} style={styles.cardWrap}><ShopCard address={`${shop.address}${shop.distanceKm !== null ? ` · ${shop.distanceKm.toFixed(1)} km` : ''}`} image={resolveShopImage(shop)} meta="Agenda disponible · Reserva en minutos" name={shop.name} onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })} /><Pressable accessibilityLabel={data.favoriteShopIds.includes(shop.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'} accessibilityRole="button" onPress={() => void toggleFavorite(shop.id)} style={styles.favoriteButton}><Ionicons color={data.favoriteShopIds.includes(shop.id) ? colors.danger : colors.graphite} name={data.favoriteShopIds.includes(shop.id) ? 'heart' : 'heart-outline'} size={22} /></Pressable></View>)}
    </Screen>
  );
}

export function ClientAppointmentsScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading, profile } = useAppData();
  const [filter, setFilter] = useState<'upcoming' | 'history'>('upcoming');
  if (!profile) return <Screen eyebrow="Citas" title="Tu agenda"><EmptyState action={<PrimaryButton label="Iniciar sesión" onPress={() => navigation.navigate('Auth')} />} message="Necesitas una cuenta para solicitar y consultar citas." title="Inicia sesión" /></Screen>;
  const items = [...data.clientAppointments].filter((item) => filter === 'upcoming' ? ['pending', 'confirmed'].includes(item.status) : !['pending', 'confirmed'].includes(item.status)).sort((left, right) => filter === 'upcoming' ? left.startAt.getTime() - right.startAt.getTime() : right.startAt.getTime() - left.startAt.getTime());
  if (loading) return <LoadingState />;
  return <Screen eyebrow="Citas" title="Tu agenda"><SelectField label="" onChange={setFilter} options={[{ label: 'Próximas', value: 'upcoming' }, { label: 'Historial', value: 'history' }]} value={filter} />{items.length === 0 ? <EmptyState message="No hay citas en esta sección." title="Todo despejado" /> : items.map((appointment) => <AppointmentCard client={appointment.barberName} date={appointment.startAt.toLocaleString('es-MX')} key={appointment.id} onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id, source: 'client' })} service={appointment.serviceName} status={appointment.status} />)}</Screen>;
}

export function ShopDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'ShopDetail'>) {
  const { data, profile } = useAppData();
  const shop = data.shops.find((item) => item.id === route.params.shopId);
  const [services, setServices] = useState<BarberService[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [detailLoading, setDetailLoading] = useState(Boolean(shop));
  const [detailError, setDetailError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!shop) return () => { active = false; };
    void Promise.resolve().then(() => {
      if (active) { setDetailLoading(true); setDetailError(null); }
      return Promise.all([listShopServices(shop.id), listShopBarbers(shop.id)]);
    })
      .then(([nextServices, nextBarbers]) => {
        if (!active) return;
        setServices(nextServices.filter((item) => item.active));
        setBarbers(nextBarbers.filter((item) => item.active));
      })
      .catch(() => { if (active) setDetailError('No pudimos cargar los servicios y el equipo. Intenta de nuevo.'); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [shop]);
  if (!shop) return <Screen title="Barbería"><EmptyState message="Este negocio ya no está disponible." title="No encontrado" /></Screen>;
  return <Screen eyebrow="Barbería" title={shop.name}><ShopCard address={shop.address} image={resolveShopImage(shop)} meta="TapFade verificado · Reserva inmediata" name={shop.name} /><PremiumHero eyebrow="Experiencia premium" subtitle={shop.description || 'Servicio profesional y agenda clara.'} title="Tu estilo, en buenas manos." />{detailLoading ? <LoadingState label="Cargando servicios y equipo…" /> : detailError ? <Banner message={detailError} tone="danger" /> : <><View style={styles.stats}><Stat icon="cut-outline" label="Servicios" value={String(services.length)} /><Stat icon="people-outline" label="Barberos" value={String(barbers.length)} /></View><SectionHeader subtitle="Toca uno para reservar" title="Servicios" />{services.slice(0, 6).map((service) => <ServiceCard duration={service.durationMinutes} key={service.id} name={service.name} onPress={() => profile ? navigation.navigate('Booking', { serviceId: service.id, shopId: shop.id }) : navigation.navigate('Auth')} price={service.price} />)}<SectionHeader subtitle="Profesionales especializados" title="Equipo" />{barbers.slice(0, 6).map((barber) => <BarberCard image={resolveBarberImage(barber)} key={barber.id} name={barber.displayName} specialties={barber.specialties} />)}</>}<PrimaryButton disabled={detailLoading || Boolean(detailError)} label={profile ? 'Solicitar una cita' : 'Inicia sesión para reservar'} onPress={() => profile ? navigation.navigate('Booking', { shopId: shop.id }) : navigation.navigate('Auth')} /></Screen>;
}

export function BookingScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Booking'>) {
  const { data, profile, refresh } = useAppData();
  const shop = data.shops.find((item) => item.id === route.params.shopId);
  const [services, setServices] = useState<BarberService[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<Date[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(Boolean(shop));
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [service, setService] = useState<BarberService | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState(addDays(new Date(), 1));
  const [slot, setSlot] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!shop) return () => { active = false; };
    void Promise.resolve().then(() => {
      if (active) { setCatalogLoading(true); setCatalogError(null); }
      return Promise.all([listShopServices(shop.id), listShopBarbers(shop.id), listShopAvailability(shop.id)]);
    })
      .then(([nextServices, nextBarbers, nextAvailability]) => {
        if (!active) return;
        const activeServices = nextServices.filter((item) => item.active);
        setServices(activeServices); setBarbers(nextBarbers.filter((item) => item.active)); setAvailability(nextAvailability);
        if (route.params.serviceId) setService(activeServices.find((item) => item.id === route.params.serviceId) ?? null);
      })
      .catch(() => { if (active) setCatalogError('No pudimos preparar esta reserva. Revisa tu conexión e intenta de nuevo.'); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [route.params.serviceId, shop]);
  useEffect(() => {
    let active = true;
    if (!shop || !barber) return () => { active = false; };
    void Promise.resolve().then(() => {
      if (active) { setScheduleLoading(true); setScheduleError(null); }
      return listBarberOccupiedSlots(shop.id, barber.id);
    })
      .then((items) => { if (active) setOccupiedSlots(items); })
      .catch(() => { if (active) { setOccupiedSlots([]); setScheduleError('No pudimos consultar la agenda. Intenta actualizar.'); } })
      .finally(() => { if (active) setScheduleLoading(false); });
    return () => { active = false; };
  }, [barber, shop]);

  const eligibleBarbers = service ? barbers.filter((item) => item.serviceIds.length === 0 || item.serviceIds.includes(service.id)) : barbers;
  const slots = service && barber ? getAvailableSlots({ availability, barberId: barber.id, date, durationMinutes: service.durationMinutes, occupiedSlots, timezone: shop?.timezone }) : [];
  async function submit() {
    if (!shop || !profile || !service || !barber || !slot) return;
    setSaving(true); setMessage(null);
    try {
      const created = await createClientAppointment({ barberId: barber.id, barberName: barber.displayName, barberShopId: shop.id, clientId: profile.uid, clientName: profile.displayName, durationSnapshot: service.durationMinutes, priceSnapshot: service.price, serviceId: service.id, serviceName: service.name, startAt: slot });
      await refresh(); navigation.navigate('AppointmentDetail', { appointmentId: created.id, source: 'client' });
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'No fue posible reservar.'); }
    finally { setSaving(false); }
  }
  if (!shop || !profile) return <Screen title="Reservar"><EmptyState message="Inicia sesión y vuelve a seleccionar una barbería." title="Reserva no disponible" /></Screen>;
  if (catalogLoading) return <LoadingState label="Preparando la agenda…" />;
  if (catalogError) return <Screen title="Reservar"><Banner message={catalogError} tone="danger" /></Screen>;
  return <Screen eyebrow="Reserva" title={shop.name}><View accessibilityLabel="Progreso de reserva" style={styles.progress}>{[1, 2, 3, 4].map((step) => <View key={step} style={[styles.progressStep, (service ? 1 : 0) + (barber ? 1 : 0) + (slot ? 2 : 0) >= step && styles.progressStepActive]} />)}</View><SectionHeader subtitle="1 de 4" title="Elige servicio" />{services.map((item) => <ServiceCard duration={item.durationMinutes} key={item.id} name={item.name} onPress={() => { setService(item); setBarber(null); setSlot(null); }} price={item.price} selected={service?.id === item.id} />)}{service ? <><SectionHeader subtitle="2 de 4" title="Elige barbero" />{eligibleBarbers.map((item) => <BarberCard image={resolveBarberImage(item)} key={item.id} name={item.displayName} onPress={() => { setBarber(item); setSlot(null); }} selected={barber?.id === item.id} specialties={item.specialties} />)}</> : null}{barber ? <><SectionHeader subtitle="3 de 4" title="Fecha y hora" /><DateField date={date} label="Fecha" maximumDate={addDays(new Date(), 60)} onChange={(selected) => { setDate(setHours(setMinutes(selected, 0), 9)); setSlot(null); }} />{scheduleLoading ? <LoadingState label="Consultando agenda…" /> : scheduleError ? <Banner message={scheduleError} tone="danger" /> : slots.length ? <TimeSlotGrid onSelect={(value) => setSlot(slots.find((item) => format(item, 'HH:mm') === value) ?? null)} selected={slot ? format(slot, 'HH:mm') : ''} slots={slots.map((item) => format(item, 'HH:mm'))} /> : <Banner message={availability.some((item) => item.barberId === barber.id) ? 'La jornada está llena o bloqueada para este día.' : 'Este barbero aún no configuró jornada para este día.'} />}</> : null}{slot && service && barber ? <View style={styles.summary}><SectionHeader subtitle="4 de 4" title="Revisa tu solicitud" /><Text style={styles.summaryText}>{service.name} · {barber.displayName}</Text><Text style={styles.summaryText}>{slot.toLocaleString('es-MX')} · {service.price.toLocaleString('es-MX', { currency: 'MXN', style: 'currency' })}</Text></View> : null}{message ? <Banner message={message} tone="danger" /> : null}<PrimaryButton disabled={!slot || scheduleLoading || Boolean(scheduleError)} label="Solicitar cita" loading={saving} onPress={() => void submit()} /></Screen>;
}

function Stat({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) { return <View style={styles.stat}><Ionicons color={colors.blue} name={icon} size={22} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  cardWrap: { marginBottom: spacing.xs, position: 'relative' }, favoriteButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 999, height: 42, justifyContent: 'center', position: 'absolute', right: 12, top: 12, width: 42 }, progress: { flexDirection: 'row', gap: spacing.sm }, progressStep: { backgroundColor: colors.coolGrey, borderRadius: 4, flex: 1, height: 5 }, progressStepActive: { backgroundColor: colors.blue }, stats: { flexDirection: 'row', gap: spacing.md }, stat: { backgroundColor: colors.surface, borderRadius: 20, flex: 1, gap: spacing.xs, padding: spacing.lg }, statLabel: { color: colors.muted, fontFamily: typography.body, fontSize: 12 }, statValue: { color: colors.graphite, fontFamily: typography.displayBold, fontSize: 22 }, summary: { backgroundColor: colors.surface, borderRadius: 20, gap: spacing.sm, padding: spacing.lg }, summaryText: { color: colors.steel, fontFamily: typography.bodyBold, fontSize: 15 },
});
