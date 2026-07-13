import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';

import {
  createOwnedBarberShop,
  createShopBarber,
  getOwnerBarberShop,
  listActiveBarberShops,
  listShopBarbers,
  updateBarberShop,
  updateShopBarber,
} from '../modules/barber-shops/barberShopRepository';
import { isValidBarber, isValidBarberShop } from '../modules/barber-shops/barberShop';
import type { Barber, BarberShop } from '../modules/barber-shops/types';
import { createShopService, listShopServices, updateShopService } from '../modules/services/serviceRepository';
import { isValidService } from '../modules/services/serviceCatalog';
import type { BarberService } from '../modules/services/types';
import {
  createBarberAvailability,
  listShopAvailability,
} from '../modules/availability/availabilityRepository';
import { isValidAvailability } from '../modules/availability/availability';
import type { AvailabilityBlock, DayOfWeek } from '../modules/availability/types';
import {
  createClientAppointment,
  listClientAppointments,
  listShopAppointments,
  transitionAppointment,
  updateClientAppointment,
} from '../modules/appointments/appointmentRepository';
import { addMinutes, canEditAppointment, canTransitionAppointment } from '../modules/appointments/appointmentRules';
import type { Appointment, AppointmentStatus } from '../modules/appointments/types';
import { buildWeeklyOccupancyReport } from '../modules/reports/weeklyReport';
import type { UserProfile } from '../modules/users/types';
import {
  AppointmentCard,
  BarberCard,
  barberImageFallback,
  EmptyState,
  IconButton,
  Screen,
  SegmentedControl,
  ServiceCard,
  ShopCard,
  shopImageFallback,
  StatCard,
  StatusPill,
  TimeSlotGrid,
  TopBar,
} from '../shared/components/AppUI';
import { PrimaryButton } from '../shared/components/PrimaryButton';
import { colors, spacing, typography } from '../shared/theme';

const Tab = createBottomTabNavigator();
const ClientBookingStack = createNativeStackNavigator();
const ClientAppointmentsStack = createNativeStackNavigator();
const BarberAgendaStack = createNativeStackNavigator();
const OwnerShopStack = createNativeStackNavigator();
const OwnerAgendaStack = createNativeStackNavigator();

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const bookingSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'];

type MainNavigatorProps = {
  profile: UserProfile;
  onSignOut: () => void;
};

type AppData = {
  activeBarber: Barber | null;
  activeShop: BarberShop | null;
  appointments: Appointment[];
  availability: AvailabilityBlock[];
  barbers: Barber[];
  clientAppointments: Appointment[];
  ownedShop: BarberShop | null;
  services: BarberService[];
  shops: BarberShop[];
};

const initialData: AppData = {
  activeBarber: null,
  activeShop: null,
  appointments: [],
  availability: [],
  barbers: [],
  clientAppointments: [],
  ownedShop: null,
  services: [],
  shops: [],
};

type ScreenContext = {
  data: AppData;
  loading: boolean;
  message: string | null;
  onMessage: (message: string | null) => void;
  profile: UserProfile;
  refresh: () => Promise<void>;
};

type BookingDraft = {
  shop: BarberShop | null;
  service: BarberService | null;
  barber: Barber | null;
  date: string;
  time: string;
};

function asImageSource(photoUrl?: string | null, fallback: ImageSourcePropType = shopImageFallback): ImageSourcePropType {
  return photoUrl ? { uri: photoUrl } : fallback;
}

function parseDateTime(value: string) {
  const date = new Date(value.trim().replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(date: Date) {
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function todayInput() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function money(value: number) {
  return `$${value.toLocaleString('es-MX')}`;
}

function appointmentsByStatus(appointments: Appointment[], status: AppointmentStatus) {
  return appointments.filter((appointment) => appointment.status === status);
}

function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}

function tabIcon(name: React.ComponentProps<typeof Ionicons>['name']) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons color={color} name={name} size={size} />;
}

export function MainNavigator({ onSignOut, profile }: MainNavigatorProps) {
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const [shops, ownedShop, clientAppointments] = await Promise.all([
        listActiveBarberShops(),
        getOwnerBarberShop(profile.uid),
        listClientAppointments(profile.uid),
      ]);

      let activeShop = ownedShop;
      let activeBarber: Barber | null = null;

      if (!activeShop && profile.role === 'barber') {
        for (const shop of shops) {
          const shopBarbers = await listShopBarbers(shop.id);
          const assigned = shopBarbers.find((barber) => barber.userId === profile.uid);
          if (assigned) {
            activeShop = shop;
            activeBarber = assigned;
            break;
          }
        }
      }

      const shopForOperations = activeShop ?? (profile.role === 'admin' ? shops[0] ?? null : null);
      const [services, barbers, availability, appointments] = shopForOperations
        ? await Promise.all([
            listShopServices(shopForOperations.id),
            listShopBarbers(shopForOperations.id),
            listShopAvailability(shopForOperations.id),
            listShopAppointments(shopForOperations.id),
          ])
        : [[], [], [], []];

      if (!activeBarber) {
        activeBarber = barbers.find((barber) => barber.userId === profile.uid) ?? null;
      }

      setData({
        activeBarber,
        activeShop: shopForOperations,
        appointments,
        availability,
        barbers,
        clientAppointments,
        ownedShop,
        services,
        shops,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cargar TapFade.');
    } finally {
      setLoading(false);
    }
  }, [profile.role, profile.uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const context = useMemo(
    () => ({ data, loading, message, onMessage: setMessage, profile, refresh }),
    [data, loading, message, profile, refresh],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text style={styles.muted}>Cargando TapFade...</Text>
      </View>
    );
  }

  if (profile.role === 'owner' || profile.role === 'admin') {
    return <OwnerNavigator context={context} onSignOut={onSignOut} />;
  }

  if (profile.role === 'barber') {
    return <BarberNavigator context={context} onSignOut={onSignOut} />;
  }

  return <ClientNavigator context={context} onSignOut={onSignOut} />;
}

function ClientNavigator({ context, onSignOut }: { context: ScreenContext; onSignOut: () => void }) {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen name="Inicio" options={{ tabBarIcon: tabIcon('home-outline') }}>
          {() => <ClientHomeScreen context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Explorar" options={{ headerShown: false, tabBarIcon: tabIcon('search-outline') }}>
          {() => <ClientBookingNavigator context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Mis Citas" options={{ headerShown: false, tabBarIcon: tabIcon('calendar-outline') }}>
          {() => <ClientAppointmentsNavigator context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Perfil" options={{ tabBarIcon: tabIcon('person-outline') }}>
          {() => <ProfileScreen onSignOut={onSignOut} profile={context.profile} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function BarberNavigator({ context, onSignOut }: { context: ScreenContext; onSignOut: () => void }) {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen name="Inicio" options={{ tabBarIcon: tabIcon('speedometer-outline') }}>
          {() => <BarberHomeScreen context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Agenda" options={{ headerShown: false, tabBarIcon: tabIcon('calendar-outline') }}>
          {() => <BarberAgendaNavigator context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Solicitudes" options={{ tabBarIcon: tabIcon('notifications-outline') }}>
          {() => <BarberRequestsScreen context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Disponibilidad" options={{ tabBarIcon: tabIcon('time-outline') }}>
          {() => <AvailabilityScreen context={context} mode="barber" />}
        </Tab.Screen>
        <Tab.Screen name="Perfil" options={{ tabBarIcon: tabIcon('person-outline') }}>
          {() => <ProfileScreen onSignOut={onSignOut} profile={context.profile} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function OwnerNavigator({ context, onSignOut }: { context: ScreenContext; onSignOut: () => void }) {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen name="Inicio" options={{ tabBarIcon: tabIcon('grid-outline') }}>
          {() => <OwnerHomeScreen context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Agenda" options={{ headerShown: false, tabBarIcon: tabIcon('calendar-outline') }}>
          {() => <OwnerAgendaNavigator context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Barberia" options={{ headerShown: false, tabBarIcon: tabIcon('business-outline') }}>
          {() => <OwnerShopNavigator context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Reportes" options={{ tabBarIcon: tabIcon('bar-chart-outline') }}>
          {() => <ReportsScreen context={context} />}
        </Tab.Screen>
        <Tab.Screen name="Perfil" options={{ tabBarIcon: tabIcon('person-outline') }}>
          {() => <ProfileScreen onSignOut={onSignOut} profile={context.profile} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function ClientBookingNavigator({ context }: { context: ScreenContext }) {
  const [draft, setDraft] = useState<BookingDraft>({
    barber: null,
    date: todayInput(),
    service: null,
    shop: null,
    time: '11:00',
  });

  return (
    <ClientBookingStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientBookingStack.Screen name="Explore">
        {(props) => <ExploreScreen {...props} context={context} draft={draft} setDraft={setDraft} />}
      </ClientBookingStack.Screen>
      <ClientBookingStack.Screen name="ShopDetail">
        {(props) => <ShopDetailScreen {...props} context={context} draft={draft} setDraft={setDraft} />}
      </ClientBookingStack.Screen>
      <ClientBookingStack.Screen name="SelectService">
        {(props) => <SelectServiceScreen {...props} context={context} draft={draft} setDraft={setDraft} />}
      </ClientBookingStack.Screen>
      <ClientBookingStack.Screen name="SelectBarber">
        {(props) => <SelectBarberScreen {...props} context={context} draft={draft} setDraft={setDraft} />}
      </ClientBookingStack.Screen>
      <ClientBookingStack.Screen name="SelectTime">
        {(props) => <SelectTimeScreen {...props} draft={draft} setDraft={setDraft} />}
      </ClientBookingStack.Screen>
      <ClientBookingStack.Screen name="ConfirmBooking">
        {(props) => <ConfirmBookingScreen {...props} context={context} draft={draft} />}
      </ClientBookingStack.Screen>
    </ClientBookingStack.Navigator>
  );
}

function ClientAppointmentsNavigator({ context }: { context: ScreenContext }) {
  return (
    <ClientAppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientAppointmentsStack.Screen name="Appointments">
        {(props) => <ClientAppointmentsScreen {...props} context={context} />}
      </ClientAppointmentsStack.Screen>
      <ClientAppointmentsStack.Screen name="AppointmentDetail">
        {(props) => <ClientAppointmentDetailScreen {...props} context={context} />}
      </ClientAppointmentsStack.Screen>
      <ClientAppointmentsStack.Screen name="Reschedule">
        {(props) => <RescheduleScreen {...props} context={context} />}
      </ClientAppointmentsStack.Screen>
    </ClientAppointmentsStack.Navigator>
  );
}

function BarberAgendaNavigator({ context }: { context: ScreenContext }) {
  return (
    <BarberAgendaStack.Navigator screenOptions={{ headerShown: false }}>
      <BarberAgendaStack.Screen name="AgendaList">
        {(props) => <BarberAgendaScreen {...props} context={context} />}
      </BarberAgendaStack.Screen>
      <BarberAgendaStack.Screen name="AppointmentDetail">
        {(props) => <OperatorAppointmentDetailScreen {...props} context={context} />}
      </BarberAgendaStack.Screen>
    </BarberAgendaStack.Navigator>
  );
}

function OwnerAgendaNavigator({ context }: { context: ScreenContext }) {
  return (
    <OwnerAgendaStack.Navigator screenOptions={{ headerShown: false }}>
      <OwnerAgendaStack.Screen name="OwnerAgendaList">
        {(props) => <OwnerAgendaScreen {...props} context={context} />}
      </OwnerAgendaStack.Screen>
      <OwnerAgendaStack.Screen name="AppointmentDetail">
        {(props) => <OperatorAppointmentDetailScreen {...props} context={context} />}
      </OwnerAgendaStack.Screen>
    </OwnerAgendaStack.Navigator>
  );
}

function OwnerShopNavigator({ context }: { context: ScreenContext }) {
  return (
    <OwnerShopStack.Navigator screenOptions={{ headerShown: false }}>
      <OwnerShopStack.Screen name="ShopHome">
        {(props) => <OwnerShopHomeScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
      <OwnerShopStack.Screen name="EditShop">
        {(props) => <EditShopScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
      <OwnerShopStack.Screen name="Services">
        {(props) => <ServicesScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
      <OwnerShopStack.Screen name="EditService">
        {(props) => <EditServiceScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
      <OwnerShopStack.Screen name="Barbers">
        {(props) => <BarbersScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
      <OwnerShopStack.Screen name="EditBarber">
        {(props) => <EditBarberScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
      <OwnerShopStack.Screen name="Availability">
        {(props) => <OwnerAvailabilityScreen {...props} context={context} />}
      </OwnerShopStack.Screen>
    </OwnerShopStack.Navigator>
  );
}

function ClientHomeScreen({ context }: { context: ScreenContext }) {
  const sorted = sortAppointments(context.data.clientAppointments);
  const next = sorted.find((appointment) => ['pending', 'confirmed'].includes(appointment.status));
  const pendingCount = appointmentsByStatus(context.data.clientAppointments, 'pending').length;

  return (
    <Screen dark eyebrow="TapFade cliente" title="Encuentra tu proximo corte">
      <TopBar
        dark
        title={context.profile.displayName || 'Cliente TapFade'}
        subtitle={`${pendingCount} solicitudes pendientes`}
        action={<IconButton icon="notifications-outline" label="Notificaciones" tone="dark" />}
      />
      <View style={styles.darkHero}>
        <Text style={styles.heroText}>Reserva rapido, confirma claro y llega a tiempo.</Text>
        <View style={styles.heroStats}>
          <StatCard label="Barberias" value={String(context.data.shops.length)} />
          <StatCard label="Citas" value={String(context.data.clientAppointments.length)} />
        </View>
      </View>
      {next ? (
        <AppointmentCard
          client={next.barberName}
          date={formatDateTime(next.startAt)}
          service={next.serviceName}
          status={next.status}
        />
      ) : (
        <EmptyState icon="search-outline" message="Explora barberias activas y solicita tu primer horario." title="Aun no tienes una cita" />
      )}
    </Screen>
  );
}

function ExploreScreen({ context, navigation, setDraft }: any) {
  return (
    <Screen dark eyebrow="Explorar" title="Barberias cerca de ti">
      <View style={styles.searchBox}>
        <Ionicons color={colors.coolGrey} name="search-outline" size={18} />
        <Text style={styles.searchText}>Buscar barberias o barberos</Text>
      </View>
      <Text style={styles.sectionTitleDark}>Recomendadas</Text>
      {context.data.shops.length === 0 ? (
        <EmptyState icon="business-outline" message="Cuando un dueno registre una barberia activa aparecera aqui." title="Sin barberias activas" />
      ) : (
        context.data.shops.map((shop: BarberShop) => (
          <ShopCard
            key={shop.id}
            address={shop.address}
            image={asImageSource(shop.photoUrl)}
            name={shop.name}
            onPress={() => {
              setDraft((current: BookingDraft) => ({ ...current, barber: null, service: null, shop }));
              navigation.navigate('ShopDetail', { shopId: shop.id });
            }}
          />
        ))
      )}
    </Screen>
  );
}

function ShopDetailScreen({ context, draft, navigation, route, setDraft }: any) {
  const shop = context.data.shops.find((item: BarberShop) => item.id === route.params?.shopId) ?? draft.shop;

  useEffect(() => {
    if (shop) {
      setDraft((current: BookingDraft) => ({ ...current, shop }));
    }
  }, [setDraft, shop]);

  if (!shop) {
    return <Screen title="Barberia"><EmptyState message="Vuelve a explorar para seleccionar una barberia." title="No seleccionada" /></Screen>;
  }

  return (
    <Screen title={shop.name} eyebrow="Detalle">
      <Image resizeMode="cover" source={asImageSource(shop.photoUrl)} style={styles.detailImage} />
      <Text style={styles.body}>{shop.description || 'Cortes modernos y servicio claro.'}</Text>
      <View style={styles.inlineCards}>
        <StatCard label="Servicios" value={String(context.data.services.length)} />
        <StatCard label="Barberos" value={String(context.data.barbers.length)} />
      </View>
      <PrimaryButton label="Elegir servicio" onPress={() => navigation.navigate('SelectService')} />
    </Screen>
  );
}

function SelectServiceScreen({ context, draft, navigation, setDraft }: any) {
  const services = context.data.services.filter((service: BarberService) => service.active);

  return (
    <Screen eyebrow="Reserva" title="Elige servicio">
      {services.length === 0 ? (
        <EmptyState icon="cut-outline" message="Esta barberia aun no tiene servicios activos." title="Sin servicios" />
      ) : (
        services.map((service: BarberService) => (
          <ServiceCard
            key={service.id}
            duration={service.durationMinutes}
            name={service.name}
            onPress={() => setDraft((current: BookingDraft) => ({ ...current, service }))}
            price={service.price}
            selected={draft.service?.id === service.id}
          />
        ))
      )}
      <PrimaryButton disabled={!draft.service} label="Continuar" onPress={() => navigation.navigate('SelectBarber')} />
    </Screen>
  );
}

function SelectBarberScreen({ context, draft, navigation, setDraft }: any) {
  const barbers = context.data.barbers.filter((barber: Barber) => barber.active);

  return (
    <Screen eyebrow="Reserva" title="Elige barbero">
      {barbers.length === 0 ? (
        <EmptyState icon="people-outline" message="Esta barberia aun no tiene barberos activos." title="Sin barberos" />
      ) : (
        barbers.map((barber: Barber) => (
          <BarberCard
            key={barber.id}
            image={asImageSource(barber.photoUrl, barberImageFallback)}
            name={barber.displayName}
            onPress={() => setDraft((current: BookingDraft) => ({ ...current, barber }))}
            selected={draft.barber?.id === barber.id}
            specialties={barber.specialties}
          />
        ))
      )}
      <PrimaryButton disabled={!draft.barber} label="Continuar" onPress={() => navigation.navigate('SelectTime')} />
    </Screen>
  );
}

function SelectTimeScreen({ draft, navigation, setDraft }: any) {
  return (
    <Screen eyebrow="Reserva" title="Fecha y hora">
      <LabeledField label="Fecha" onChangeText={(date) => setDraft((current: BookingDraft) => ({ ...current, date }))} placeholder="YYYY-MM-DD" value={draft.date} />
      <TimeSlotGrid selected={draft.time} slots={bookingSlots} onSelect={(time) => setDraft((current: BookingDraft) => ({ ...current, time }))} />
      <PrimaryButton label="Confirmar horario" onPress={() => navigation.navigate('ConfirmBooking')} />
    </Screen>
  );
}

function ConfirmBookingScreen({ context, draft, navigation }: any) {
  async function submit() {
    if (!draft.shop || !draft.service || !draft.barber) {
      context.onMessage('Completa barberia, servicio y barbero.');
      return;
    }
    const startAt = parseDateTime(`${draft.date} ${draft.time}`);
    if (!startAt) {
      context.onMessage('Usa una fecha valida.');
      return;
    }
    await createClientAppointment({
      barberId: draft.barber.id,
      barberName: draft.barber.displayName,
      barberShopId: draft.shop.id,
      clientId: context.profile.uid,
      clientName: context.profile.displayName,
      durationSnapshot: draft.service.durationMinutes,
      priceSnapshot: draft.service.price,
      serviceId: draft.service.id,
      serviceName: draft.service.name,
      startAt,
    });
    context.onMessage('Cita solicitada. Queda pendiente de confirmacion.');
    await context.refresh();
    navigation.popToTop();
  }

  return (
    <Screen eyebrow="Resumen" title="Confirma tu cita">
      <SummaryLine label="Barberia" value={draft.shop?.name ?? '-'} />
      <SummaryLine label="Servicio" value={draft.service ? `${draft.service.name} · ${money(draft.service.price)}` : '-'} />
      <SummaryLine label="Barbero" value={draft.barber?.displayName ?? '-'} />
      <SummaryLine label="Horario" value={`${draft.date} ${draft.time}`} />
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      <PrimaryButton label="Solicitar cita" onPress={() => void submit()} />
    </Screen>
  );
}

function ClientAppointmentsScreen({ context, navigation }: any) {
  const appointments = sortAppointments(context.data.clientAppointments);

  return (
    <Screen eyebrow="Cliente" title="Mis citas">
      {appointments.length === 0 ? (
        <EmptyState message="Tus solicitudes y citas confirmadas apareceran aqui." title="Sin citas" />
      ) : (
        appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            client={appointment.barberName}
            date={formatDateTime(appointment.startAt)}
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
            service={appointment.serviceName}
            status={appointment.status}
          />
        ))
      )}
    </Screen>
  );
}

function ClientAppointmentDetailScreen({ context, navigation, route }: any) {
  const appointment = context.data.clientAppointments.find((item: Appointment) => item.id === route.params?.appointmentId);

  if (!appointment) {
    return <Screen title="Cita"><EmptyState message="No encontramos esta cita." title="Cita no disponible" /></Screen>;
  }

  async function cancel() {
    if (!canEditAppointment(appointment)) {
      context.onMessage('Esta cita ya no se puede cancelar desde cliente.');
      return;
    }
    await transitionAppointment(appointment.id, 'cancelled');
    await context.refresh();
  }

  return (
    <Screen eyebrow="Detalle" title={appointment.serviceName}>
      <SummaryLine label="Barbero" value={appointment.barberName} />
      <SummaryLine label="Fecha" value={formatDateTime(appointment.startAt)} />
      <SummaryLine label="Precio" value={money(appointment.priceSnapshot)} />
      <StatusPill status={appointment.status} />
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      <PrimaryButton disabled={!canEditAppointment(appointment)} label="Reagendar" onPress={() => navigation.navigate('Reschedule', { appointmentId: appointment.id })} />
      <PrimaryButton disabled={!canEditAppointment(appointment)} label="Cancelar cita" onPress={() => void cancel()} />
    </Screen>
  );
}

function RescheduleScreen({ context, navigation, route }: any) {
  const appointment = context.data.clientAppointments.find((item: Appointment) => item.id === route.params?.appointmentId);
  const [date, setDate] = useState(todayInput());
  const [time, setTime] = useState('11:00');

  if (!appointment) {
    return <Screen title="Reagendar"><EmptyState message="No encontramos esta cita." title="Cita no disponible" /></Screen>;
  }

  async function submit() {
    const startAt = parseDateTime(`${date} ${time}`);
    if (!startAt) {
      context.onMessage('Usa una fecha valida.');
      return;
    }
    await updateClientAppointment({
      ...appointment,
      endAt: addMinutes(startAt, appointment.durationSnapshot),
      startAt,
    });
    await context.refresh();
    navigation.goBack();
  }

  return (
    <Screen eyebrow="Cliente" title="Reagendar">
      <LabeledField label="Fecha" onChangeText={setDate} placeholder="YYYY-MM-DD" value={date} />
      <TimeSlotGrid selected={time} slots={bookingSlots} onSelect={setTime} />
      <PrimaryButton disabled={!canEditAppointment(appointment)} label="Guardar nuevo horario" onPress={() => void submit()} />
    </Screen>
  );
}

function BarberHomeScreen({ context }: { context: ScreenContext }) {
  const ownAppointments = context.data.activeBarber
    ? context.data.appointments.filter((appointment) => appointment.barberId === context.data.activeBarber?.id)
    : [];
  const pending = appointmentsByStatus(ownAppointments, 'pending');

  return (
    <Screen eyebrow="Barbero" title="Tu dia en TapFade">
      <View style={styles.inlineCards}>
        <StatCard label="Hoy" value={String(ownAppointments.length)} />
        <StatCard label="Pendientes" value={String(pending.length)} />
      </View>
      {context.data.activeBarber ? (
        <BarberCard
          image={asImageSource(context.data.activeBarber.photoUrl, barberImageFallback)}
          name={context.data.activeBarber.displayName}
          specialties={context.data.activeBarber.specialties}
        />
      ) : (
        <EmptyState icon="person-add-outline" message="Pide al dueno que vincule tu usuario al barbero de la barberia." title="Barbero no asignado" />
      )}
    </Screen>
  );
}

function BarberAgendaScreen({ context, navigation }: any) {
  const appointments = context.data.activeBarber
    ? sortAppointments(context.data.appointments.filter((appointment: Appointment) => appointment.barberId === context.data.activeBarber?.id))
    : [];

  return (
    <Screen eyebrow="Barbero" title="Agenda">
      {appointments.length === 0 ? (
        <EmptyState message="Tus citas asignadas apareceran aqui." title="Agenda vacia" />
      ) : (
        appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            client={appointment.clientName}
            date={formatDateTime(appointment.startAt)}
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
            service={appointment.serviceName}
            status={appointment.status}
          />
        ))
      )}
    </Screen>
  );
}

function BarberRequestsScreen({ context }: { context: ScreenContext }) {
  const requests = context.data.activeBarber
    ? context.data.appointments.filter((appointment) => appointment.barberId === context.data.activeBarber?.id && appointment.status === 'pending')
    : [];

  return (
    <Screen eyebrow="Barbero" title="Solicitudes">
      {requests.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" message="No tienes citas pendientes por responder." title="Todo al dia" />
      ) : (
        requests.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            client={appointment.clientName}
            date={formatDateTime(appointment.startAt)}
            primaryAction={<MiniButton label="OK" onPress={() => void changeAppointmentStatus(context, appointment, 'confirmed')} />}
            secondaryAction={<MiniButton muted label="NO" onPress={() => void changeAppointmentStatus(context, appointment, 'rejected')} />}
            service={appointment.serviceName}
            status={appointment.status}
          />
        ))
      )}
    </Screen>
  );
}

function OwnerHomeScreen({ context }: { context: ScreenContext }) {
  const report = buildWeeklyOccupancyReport(context.data.appointments);

  return (
    <Screen eyebrow="Dueno" title="Operacion de barberia">
      {context.data.activeShop ? (
        <ShopCard address={context.data.activeShop.address} image={asImageSource(context.data.activeShop.photoUrl)} name={context.data.activeShop.name} />
      ) : (
        <EmptyState icon="business-outline" message="Crea una barberia para activar servicios, barberos y agenda." title="Sin barberia" />
      )}
      <View style={styles.inlineCards}>
        <StatCard label="Citas semana" value={String(report.appointmentCount)} />
        <StatCard label="Ingresos" value={money(report.estimatedRevenue)} />
      </View>
    </Screen>
  );
}

function OwnerAgendaScreen({ context, navigation }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const appointments = sortAppointments(
    context.data.appointments.filter((appointment: Appointment) => filter === 'all' || appointment.status === filter),
  );

  return (
    <Screen eyebrow="Dueno" title="Agenda general">
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { label: 'Todas', value: 'all' },
          { label: 'Pendientes', value: 'pending' },
          { label: 'Confirmadas', value: 'confirmed' },
        ]}
      />
      {appointments.length === 0 ? (
        <EmptyState message="No hay citas para este filtro." title="Sin citas" />
      ) : (
        appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            client={`${appointment.clientName} · ${appointment.barberName}`}
            date={formatDateTime(appointment.startAt)}
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
            service={appointment.serviceName}
            status={appointment.status}
          />
        ))
      )}
    </Screen>
  );
}

function OwnerShopHomeScreen({ context, navigation }: any) {
  if (!context.data.activeShop) {
    return <EditShopScreen context={context} navigation={navigation} route={{ params: { create: true } }} />;
  }

  return (
    <Screen eyebrow="Dueno" title="Barberia">
      <ShopCard address={context.data.activeShop.address} image={asImageSource(context.data.activeShop.photoUrl)} name={context.data.activeShop.name} />
      <MenuRow icon="create-outline" label="Editar barberia" onPress={() => navigation.navigate('EditShop')} />
      <MenuRow icon="cut-outline" label="Servicios" value={String(context.data.services.length)} onPress={() => navigation.navigate('Services')} />
      <MenuRow icon="people-outline" label="Barberos" value={String(context.data.barbers.length)} onPress={() => navigation.navigate('Barbers')} />
      <MenuRow icon="time-outline" label="Disponibilidad" value={String(context.data.availability.length)} onPress={() => navigation.navigate('Availability')} />
    </Screen>
  );
}

function EditShopScreen({ context, navigation }: any) {
  const shop = context.data.activeShop;
  const [name, setName] = useState(shop?.name ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [address, setAddress] = useState(shop?.address ?? '');
  const [photoUrl, setPhotoUrl] = useState(shop?.photoUrl ?? '');

  async function submit() {
    const input = { address, description, name, ownerId: context.profile.uid, photoUrl };
    if (!isValidBarberShop(input)) {
      context.onMessage('Completa nombre y direccion de la barberia.');
      return;
    }

    if (shop) {
      await updateBarberShop({ ...shop, address, description, name, photoUrl: photoUrl.trim() || null });
    } else {
      await createOwnedBarberShop(input);
    }
    await context.refresh();
    navigation.goBack?.();
  }

  return (
    <Screen eyebrow="Dueno" title={shop ? 'Editar barberia' : 'Crear barberia'}>
      <LabeledField label="Nombre" onChangeText={setName} placeholder="TapFade Studio" value={name} />
      <LabeledField label="Descripcion" onChangeText={setDescription} placeholder="Fades y barba" value={description} />
      <LabeledField label="Direccion" onChangeText={setAddress} placeholder="Calle, colonia, ciudad" value={address} />
      <LabeledField label="Foto URL" onChangeText={setPhotoUrl} placeholder="https://..." value={photoUrl} />
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      <PrimaryButton label={shop ? 'Guardar cambios' : 'Crear barberia'} onPress={() => void submit()} />
    </Screen>
  );
}

function ServicesScreen({ context, navigation }: any) {
  return (
    <Screen eyebrow="Dueno" title="Servicios">
      <PrimaryButton label="Agregar servicio" onPress={() => navigation.navigate('EditService')} />
      {context.data.services.length === 0 ? (
        <EmptyState icon="cut-outline" message="Agrega servicios con precio y duracion." title="Sin servicios" />
      ) : (
        context.data.services.map((service: BarberService) => (
          <ServiceCard
            key={service.id}
            duration={service.durationMinutes}
            name={service.name}
            onPress={() => navigation.navigate('EditService', { serviceId: service.id })}
            price={service.price}
          />
        ))
      )}
    </Screen>
  );
}

function EditServiceScreen({ context, navigation, route }: any) {
  const service = context.data.services.find((item: BarberService) => item.id === route.params?.serviceId);
  const [name, setName] = useState(service?.name ?? '');
  const [price, setPrice] = useState(String(service?.price ?? 250));
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 45));

  async function submit() {
    if (!context.data.activeShop) {
      return;
    }
    const input = {
      barberShopId: context.data.activeShop.id,
      durationMinutes: Number(duration),
      name,
      price: Number(price),
    };
    if (!isValidService(input)) {
      context.onMessage('Servicio invalido. Usa duracion en bloques de 15 minutos.');
      return;
    }
    if (service) {
      await updateShopService({ ...service, durationMinutes: input.durationMinutes, name, price: input.price });
    } else {
      await createShopService(input);
    }
    await context.refresh();
    navigation.goBack();
  }

  return (
    <Screen eyebrow="Dueno" title={service ? 'Editar servicio' : 'Crear servicio'}>
      <LabeledField label="Servicio" onChangeText={setName} placeholder="Corte + barba" value={name} />
      <LabeledField keyboardType="numeric" label="Precio" onChangeText={setPrice} placeholder="250" value={price} />
      <LabeledField keyboardType="numeric" label="Duracion min" onChangeText={setDuration} placeholder="45" value={duration} />
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      <PrimaryButton label="Guardar servicio" onPress={() => void submit()} />
    </Screen>
  );
}

function BarbersScreen({ context, navigation }: any) {
  return (
    <Screen eyebrow="Dueno" title="Barberos">
      <PrimaryButton label="Agregar barbero" onPress={() => navigation.navigate('EditBarber')} />
      {context.data.barbers.length === 0 ? (
        <EmptyState icon="people-outline" message="Agrega barberos para abrir agenda." title="Sin barberos" />
      ) : (
        context.data.barbers.map((barber: Barber) => (
          <BarberCard
            key={barber.id}
            image={asImageSource(barber.photoUrl, barberImageFallback)}
            name={barber.displayName}
            onPress={() => navigation.navigate('EditBarber', { barberId: barber.id })}
            specialties={barber.specialties}
          />
        ))
      )}
    </Screen>
  );
}

function EditBarberScreen({ context, navigation, route }: any) {
  const barber = context.data.barbers.find((item: Barber) => item.id === route.params?.barberId);
  const [displayName, setDisplayName] = useState(barber?.displayName ?? '');
  const [specialties, setSpecialties] = useState(barber?.specialties.join(', ') ?? '');
  const [photoUrl, setPhotoUrl] = useState(barber?.photoUrl ?? '');
  const [userId, setUserId] = useState(barber?.userId ?? '');

  async function submit() {
    if (!context.data.activeShop) {
      return;
    }
    const input = {
      barberShopId: context.data.activeShop.id,
      displayName,
      photoUrl,
      specialties: specialties.split(','),
      userId: userId.trim() || null,
    };
    if (!isValidBarber(input)) {
      context.onMessage('Agrega un nombre valido para el barbero.');
      return;
    }
    if (barber) {
      await updateShopBarber({
        ...barber,
        displayName,
        photoUrl: photoUrl.trim() || null,
        specialties: specialties.split(',').map((value: string) => value.trim()).filter(Boolean),
        userId: userId.trim() || null,
      });
    } else {
      await createShopBarber(input);
    }
    await context.refresh();
    navigation.goBack();
  }

  return (
    <Screen eyebrow="Dueno" title={barber ? 'Editar barbero' : 'Crear barbero'}>
      <LabeledField label="Nombre" onChangeText={setDisplayName} placeholder="Alex Torres" value={displayName} />
      <LabeledField label="Especialidades" onChangeText={setSpecialties} placeholder="fade, barba" value={specialties} />
      <LabeledField label="Foto URL" onChangeText={setPhotoUrl} placeholder="https://..." value={photoUrl} />
      <LabeledField label="User ID" onChangeText={setUserId} placeholder="uid de Firebase opcional" value={userId} />
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      <PrimaryButton label="Guardar barbero" onPress={() => void submit()} />
    </Screen>
  );
}

function OwnerAvailabilityScreen({ context }: any) {
  return <AvailabilityScreen context={context} mode="owner" />;
}

function AvailabilityScreen({ context, mode }: { context: ScreenContext; mode: 'barber' | 'owner' }) {
  const activeBarberId = mode === 'barber' ? context.data.activeBarber?.id : context.data.barbers[0]?.id;
  const [barberId, setBarberId] = useState(activeBarberId ?? '');
  const [day, setDay] = useState('1');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [reason, setReason] = useState('');
  const [blocked, setBlocked] = useState(false);

  async function submit() {
    if (!context.data.activeShop || !barberId) {
      context.onMessage('Selecciona o crea un barbero antes de configurar agenda.');
      return;
    }
    const input = {
      barberId,
      barberShopId: context.data.activeShop.id,
      blocked,
      dayOfWeek: Number(day) as DayOfWeek,
      endTime: end,
      reason: reason.trim() || null,
      startTime: start,
    };
    if (!isValidAvailability(input)) {
      context.onMessage('Horario invalido. Usa HH:mm en bloques de 15 minutos.');
      return;
    }
    await createBarberAvailability(input);
    await context.refresh();
  }

  return (
    <Screen eyebrow={mode === 'owner' ? 'Dueno' : 'Barbero'} title="Disponibilidad">
      {mode === 'owner' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {context.data.barbers.map((barber) => (
            <Pressable key={barber.id} onPress={() => setBarberId(barber.id)} style={[styles.chip, barberId === barber.id && styles.chipActive]}>
              <Text style={[styles.chipText, barberId === barber.id && styles.chipTextActive]}>{barber.displayName}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <SegmentedControl
        value={blocked ? 'blocked' : 'open'}
        onChange={(value) => setBlocked(value === 'blocked')}
        options={[
          { label: 'Horario', value: 'open' },
          { label: 'Bloqueo', value: 'blocked' },
        ]}
      />
      <LabeledField keyboardType="numeric" label="Dia 0-6" onChangeText={setDay} placeholder="1" value={day} />
      <LabeledField label="Inicio" onChangeText={setStart} placeholder="09:00" value={start} />
      <LabeledField label="Fin" onChangeText={setEnd} placeholder="18:00" value={end} />
      <LabeledField label="Motivo" onChangeText={setReason} placeholder="Descanso, comida, ausencia" value={reason} />
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      <PrimaryButton label={blocked ? 'Agregar bloqueo' : 'Agregar horario'} onPress={() => void submit()} />
      {context.data.availability.map((block) => (
        <View key={block.id} style={styles.summaryCard}>
          <Text style={styles.cardTitle}>{dayLabels[block.dayOfWeek]} · {block.startTime}-{block.endTime}</Text>
          <Text style={styles.muted}>{block.blocked ? `Bloqueo: ${block.reason ?? 'Sin motivo'}` : 'Disponible'}</Text>
        </View>
      ))}
    </Screen>
  );
}

function OperatorAppointmentDetailScreen({ context, route }: any) {
  const appointment = context.data.appointments.find((item: Appointment) => item.id === route.params?.appointmentId);

  if (!appointment) {
    return <Screen title="Cita"><EmptyState message="No encontramos esta cita." title="Cita no disponible" /></Screen>;
  }

  return (
    <Screen eyebrow="Operacion" title={appointment.serviceName}>
      <SummaryLine label="Cliente" value={appointment.clientName} />
      <SummaryLine label="Barbero" value={appointment.barberName} />
      <SummaryLine label="Fecha" value={formatDateTime(appointment.startAt)} />
      <SummaryLine label="Precio" value={money(appointment.priceSnapshot)} />
      <StatusPill status={appointment.status} />
      <View style={styles.actionRow}>
        <MiniButton label="Confirmar" onPress={() => void changeAppointmentStatus(context, appointment, 'confirmed')} />
        <MiniButton muted label="Rechazar" onPress={() => void changeAppointmentStatus(context, appointment, 'rejected')} />
      </View>
      <PrimaryButton label="Marcar completada" onPress={() => void changeAppointmentStatus(context, appointment, 'completed')} />
    </Screen>
  );
}

function ReportsScreen({ context }: { context: ScreenContext }) {
  const report = buildWeeklyOccupancyReport(context.data.appointments);

  return (
    <Screen eyebrow="Dueno" title="Reportes">
      <View style={styles.inlineCards}>
        <StatCard label="Citas" value={String(report.appointmentCount)} />
        <StatCard label="Ingresos" value={money(report.estimatedRevenue)} />
      </View>
      <StatCard label="Minutos ocupados" value={String(report.occupiedMinutes)} />
      {report.byBarber.length === 0 ? (
        <EmptyState icon="bar-chart-outline" message="Las citas confirmadas o completadas alimentan el reporte semanal." title="Sin datos reportables" />
      ) : (
        report.byBarber.map((barber) => (
          <View key={barber.barberId} style={styles.summaryCard}>
            <Text style={styles.cardTitle}>{barber.barberName}</Text>
            <Text style={styles.muted}>{barber.appointmentCount} citas · {barber.occupiedMinutes} min · {money(barber.estimatedRevenue)}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

function ProfileScreen({ onSignOut, profile }: { onSignOut: () => void; profile: UserProfile }) {
  return (
    <Screen eyebrow="Perfil" title={profile.displayName || 'Usuario TapFade'}>
      <SummaryLine label="Correo" value={profile.email} />
      <SummaryLine label="Rol" value={profile.role} />
      <PrimaryButton label="Cerrar sesion" onPress={onSignOut} />
    </Screen>
  );
}

async function changeAppointmentStatus(context: ScreenContext, appointment: Appointment, status: AppointmentStatus) {
  if (!canTransitionAppointment(appointment.status, status)) {
    Alert.alert('Cambio no permitido', 'La cita ya no acepta ese cambio de estado.');
    return;
  }
  await transitionAppointment(appointment.id, status);
  await context.refresh();
}

function LabeledField({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'numeric';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; value?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Ionicons color={colors.blue} name={icon} size={22} />
      <Text style={styles.menuText}>{label}</Text>
      {value ? <Text style={styles.muted}>{value}</Text> : null}
      <Ionicons color={colors.muted} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function MiniButton({ label, muted, onPress }: { label: string; muted?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.miniButton, muted && styles.miniButtonMuted, pressed && styles.pressed]}>
      <Text style={styles.miniButtonText}>{label}</Text>
    </Pressable>
  );
}

const tabOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { color: colors.graphite, fontFamily: typography.displayBold },
  tabBarActiveTintColor: colors.blue,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontFamily: typography.bodyBold, fontSize: 11 },
  tabBarStyle: { borderTopColor: colors.coolGrey },
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  body: {
    color: colors.steel,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  cardTitle: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 16,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.graphite,
    borderColor: colors.graphite,
  },
  chipText: {
    color: colors.graphite,
    fontFamily: typography.bodyBold,
  },
  chipTextActive: {
    color: colors.surface,
  },
  darkHero: {
    backgroundColor: colors.graphite,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  detailImage: {
    backgroundColor: colors.graphite,
    borderRadius: 8,
    height: 210,
    width: '100%',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroText: {
    color: colors.surface,
    fontFamily: typography.displayBold,
    fontSize: 22,
    lineHeight: 28,
  },
  horizontalList: {
    flexGrow: 0,
  },
  inlineCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.graphite,
    fontFamily: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  label: {
    color: colors.steel,
    fontFamily: typography.bodyBold,
    fontSize: 13,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  menuRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  menuText: {
    color: colors.graphite,
    flex: 1,
    fontFamily: typography.bodyBlack,
    fontSize: 15,
  },
  miniButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 8,
    minHeight: 40,
    minWidth: 88,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  miniButtonMuted: {
    backgroundColor: colors.steel,
  },
  miniButtonText: {
    color: colors.surface,
    fontFamily: typography.bodyBlack,
    fontSize: 13,
  },
  muted: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  notice: {
    backgroundColor: colors.blueGlow,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.graphite,
    fontFamily: typography.bodyBold,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.82,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  searchText: {
    color: colors.coolGrey,
    fontFamily: typography.body,
    fontSize: 14,
  },
  sectionTitleDark: {
    color: colors.surface,
    fontFamily: typography.bodyBlack,
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  summaryLine: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  summaryValue: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 16,
  },
});
