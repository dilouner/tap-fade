import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createOwnedBarberShop,
  createShopBarber,
  getOwnerBarberShop,
  listActiveBarberShops,
  listShopBarbers,
} from '../modules/barber-shops/barberShopRepository';
import { isValidBarber, isValidBarberShop } from '../modules/barber-shops/barberShop';
import type { Barber, BarberShop } from '../modules/barber-shops/types';
import { createShopService, listShopServices } from '../modules/services/serviceRepository';
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
} from '../modules/appointments/appointmentRepository';
import { canEditAppointment, canTransitionAppointment } from '../modules/appointments/appointmentRules';
import type { Appointment } from '../modules/appointments/types';
import { buildWeeklyOccupancyReport } from '../modules/reports/weeklyReport';
import type { UserProfile } from '../modules/users/types';
import { PrimaryButton } from '../shared/components/PrimaryButton';
import { colors, spacing, typography } from '../shared/theme';

const Tab = createBottomTabNavigator();
const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

type MainNavigatorProps = {
  profile: UserProfile;
  onSignOut: () => void;
};

type AppData = {
  appointments: Appointment[];
  availability: AvailabilityBlock[];
  barbers: Barber[];
  clientAppointments: Appointment[];
  ownedShop: BarberShop | null;
  services: BarberService[];
  shops: BarberShop[];
};

const initialData: AppData = {
  appointments: [],
  availability: [],
  barbers: [],
  clientAppointments: [],
  ownedShop: null,
  services: [],
  shops: [],
};

function parseDateTime(value: string) {
  const normalized = value.trim().replace(' ', 'T');
  const date = new Date(normalized);
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

function defaultStartValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return `${date.toISOString().slice(0, 10)} 10:00`;
}

export function MainNavigator({ onSignOut, profile }: MainNavigatorProps) {
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const ownerMode = Boolean(data.ownedShop) || ['owner', 'barber', 'admin'].includes(profile.role);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const [shops, ownedShop, clientAppointments] = await Promise.all([
        listActiveBarberShops(),
        getOwnerBarberShop(profile.uid),
        listClientAppointments(profile.uid),
      ]);
      const activeShop = ownedShop ?? shops[0] ?? null;
      const [services, barbers, availability, appointments] = activeShop
        ? await Promise.all([
            listShopServices(activeShop.id),
            listShopBarbers(activeShop.id),
            listShopAvailability(activeShop.id),
            listShopAppointments(activeShop.id),
          ])
        : [[], [], [], []];

      setData({
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
  }, [profile.uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const context = useMemo(
    () => ({
      data,
      loading,
      message,
      onMessage: setMessage,
      profile,
      refresh,
    }),
    [data, loading, message, profile, refresh],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text style={styles.muted}>Cargando operacion TapFade...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.graphite, fontFamily: typography.displayBold },
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: typography.bodyBold, fontSize: 11 },
        }}
      >
        {ownerMode ? (
          <>
            <Tab.Screen name="Mi barberia">{() => <OwnerShopScreen context={context} />}</Tab.Screen>
            <Tab.Screen name="Agenda">{() => <AgendaScreen context={context} />}</Tab.Screen>
            <Tab.Screen name="Reportes">{() => <ReportsScreen context={context} />}</Tab.Screen>
            <Tab.Screen name="Perfil">{() => <ProfileScreen onSignOut={onSignOut} profile={profile} />}</Tab.Screen>
          </>
        ) : (
          <>
            <Tab.Screen name="Explorar">{() => <ExploreScreen context={context} />}</Tab.Screen>
            <Tab.Screen name="Mis citas">{() => <ClientAppointmentsScreen context={context} />}</Tab.Screen>
            <Tab.Screen name="Perfil">{() => <ProfileScreen onSignOut={onSignOut} profile={profile} />}</Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

type ScreenContext = {
  data: AppData;
  loading: boolean;
  message: string | null;
  onMessage: (message: string | null) => void;
  profile: UserProfile;
  refresh: () => Promise<void>;
};

function ScreenFrame({ children, context, title }: { children: React.ReactNode; context: ScreenContext; title: string }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>TapFade MVP</Text>
      <Text style={styles.screenTitle}>{title}</Text>
      {context.message ? <Text style={styles.notice}>{context.message}</Text> : null}
      {children}
    </ScrollView>
  );
}

function Field({
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

function OwnerShopScreen({ context }: { context: ScreenContext }) {
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('250');
  const [serviceDuration, setServiceDuration] = useState('45');
  const [barberName, setBarberName] = useState('');
  const [barberSpecialties, setBarberSpecialties] = useState('');
  const [availabilityDay, setAvailabilityDay] = useState('1');
  const [availabilityStart, setAvailabilityStart] = useState('09:00');
  const [availabilityEnd, setAvailabilityEnd] = useState('18:00');
  const shop = context.data.ownedShop;

  async function submitShop() {
    const input = {
      address: shopAddress,
      description: shopDescription,
      name: shopName,
      ownerId: context.profile.uid,
    };

    if (!isValidBarberShop(input)) {
      context.onMessage('Completa nombre y direccion de la barberia.');
      return;
    }

    await createOwnedBarberShop(input);
    context.onMessage('Barberia creada y rol owner activado.');
    await context.refresh();
  }

  async function submitService() {
    if (!shop) {
      return;
    }

    const input = {
      barberShopId: shop.id,
      durationMinutes: Number(serviceDuration),
      name: serviceName,
      price: Number(servicePrice),
    };

    if (!isValidService(input)) {
      context.onMessage('Servicio invalido. Usa duracion en bloques de 15 minutos.');
      return;
    }

    await createShopService(input);
    setServiceName('');
    await context.refresh();
  }

  async function submitBarber() {
    if (!shop) {
      return;
    }

    const input = {
      barberShopId: shop.id,
      displayName: barberName,
      specialties: barberSpecialties.split(','),
    };

    if (!isValidBarber(input)) {
      context.onMessage('Agrega un nombre valido para el barbero.');
      return;
    }

    await createShopBarber(input);
    setBarberName('');
    setBarberSpecialties('');
    await context.refresh();
  }

  async function submitAvailability() {
    if (!shop || context.data.barbers.length === 0) {
      context.onMessage('Crea al menos un barbero antes de configurar agenda.');
      return;
    }

    const input = {
      barberId: context.data.barbers[0].id,
      barberShopId: shop.id,
      dayOfWeek: Number(availabilityDay) as DayOfWeek,
      endTime: availabilityEnd,
      startTime: availabilityStart,
    };

    if (!isValidAvailability(input)) {
      context.onMessage('Horario invalido. Usa HH:mm en bloques de 15 minutos.');
      return;
    }

    await createBarberAvailability(input);
    await context.refresh();
  }

  return (
    <ScreenFrame context={context} title="Operacion de barberia">
      {!shop ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Crea tu barberia</Text>
          <Field label="Nombre" onChangeText={setShopName} placeholder="TapFade Studio" value={shopName} />
          <Field label="Descripcion" onChangeText={setShopDescription} placeholder="Cortes modernos y fades" value={shopDescription} />
          <Field label="Direccion" onChangeText={setShopAddress} placeholder="Calle, colonia, ciudad" value={shopAddress} />
          <PrimaryButton label="Crear barberia" onPress={() => void submitShop()} />
        </View>
      ) : (
        <>
          <View style={styles.heroBand}>
            <Text style={styles.heroTitle}>{shop.name}</Text>
            <Text style={styles.heroText}>{shop.address}</Text>
            <Text style={styles.badge}>Activa</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Servicios</Text>
            <Field label="Servicio" onChangeText={setServiceName} placeholder="Corte + barba" value={serviceName} />
            <Field keyboardType="numeric" label="Precio" onChangeText={setServicePrice} placeholder="250" value={servicePrice} />
            <Field keyboardType="numeric" label="Duracion min" onChangeText={setServiceDuration} placeholder="45" value={serviceDuration} />
            <PrimaryButton label="Agregar servicio" onPress={() => void submitService()} />
            {context.data.services.map((service) => (
              <Text key={service.id} style={styles.listLine}>
                {service.name} · ${service.price} · {service.durationMinutes} min
              </Text>
            ))}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Barberos</Text>
            <Field label="Nombre" onChangeText={setBarberName} placeholder="Brandon" value={barberName} />
            <Field label="Especialidades" onChangeText={setBarberSpecialties} placeholder="fade, barba" value={barberSpecialties} />
            <PrimaryButton label="Agregar barbero" onPress={() => void submitBarber()} />
            {context.data.barbers.map((barber) => (
              <Text key={barber.id} style={styles.listLine}>
                {barber.displayName} · {barber.specialties.join(', ') || 'General'}
              </Text>
            ))}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Disponibilidad</Text>
            <Field keyboardType="numeric" label="Dia 0-6" onChangeText={setAvailabilityDay} placeholder="1" value={availabilityDay} />
            <Field label="Inicio" onChangeText={setAvailabilityStart} placeholder="09:00" value={availabilityStart} />
            <Field label="Fin" onChangeText={setAvailabilityEnd} placeholder="18:00" value={availabilityEnd} />
            <PrimaryButton label="Agregar horario al primer barbero" onPress={() => void submitAvailability()} />
            {context.data.availability.map((block) => (
              <Text key={block.id} style={styles.listLine}>
                {dayLabels[block.dayOfWeek]} · {block.startTime}-{block.endTime}
              </Text>
            ))}
          </View>
        </>
      )}
    </ScreenFrame>
  );
}

function ExploreScreen({ context }: { context: ScreenContext }) {
  const [selectedShopId, setSelectedShopId] = useState(context.data.shops[0]?.id ?? '');
  const [shopBarbers, setShopBarbers] = useState<Barber[]>([]);
  const [shopServices, setShopServices] = useState<BarberService[]>([]);
  const [startValue, setStartValue] = useState(defaultStartValue());
  const selectedShop = context.data.shops.find((shop) => shop.id === selectedShopId) ?? context.data.shops[0] ?? null;
  const service = shopServices[0] ?? null;
  const barber = shopBarbers[0] ?? null;

  useEffect(() => {
    let mounted = true;

    async function loadSelectedShopData() {
      if (!selectedShop) {
        setShopBarbers([]);
        setShopServices([]);
        return;
      }

      const [services, barbers] = await Promise.all([
        listShopServices(selectedShop.id),
        listShopBarbers(selectedShop.id),
      ]);

      if (mounted) {
        setShopServices(services.filter((item) => item.active));
        setShopBarbers(barbers.filter((item) => item.active));
      }
    }

    void loadSelectedShopData();

    return () => {
      mounted = false;
    };
  }, [selectedShop]);

  async function submitAppointment() {
    if (!selectedShop || !service || !barber) {
      context.onMessage('La barberia necesita servicio y barbero para agendar.');
      return;
    }

    const startAt = parseDateTime(startValue);
    if (!startAt) {
      context.onMessage('Usa fecha valida: YYYY-MM-DD HH:mm.');
      return;
    }

    await createClientAppointment({
      barberId: barber.id,
      barberName: barber.displayName,
      barberShopId: selectedShop.id,
      clientId: context.profile.uid,
      clientName: context.profile.displayName,
      durationSnapshot: service.durationMinutes,
      priceSnapshot: service.price,
      serviceId: service.id,
      serviceName: service.name,
      startAt,
    });
    context.onMessage('Cita solicitada. Queda pendiente de confirmacion.');
    await context.refresh();
  }

  return (
    <ScreenFrame context={context} title="Explorar barberias">
      {context.data.shops.map((shop) => (
        <Pressable key={shop.id} onPress={() => setSelectedShopId(shop.id)} style={styles.panel}>
          <Text style={styles.panelTitle}>{shop.name}</Text>
          <Text style={styles.muted}>{shop.address}</Text>
        </Pressable>
      ))}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Solicitar cita</Text>
        <Text style={styles.listLine}>{selectedShop?.name ?? 'Sin barberias activas'}</Text>
        <Text style={styles.listLine}>{service ? `${service.name} · ${service.durationMinutes} min · $${service.price}` : 'Sin servicios'}</Text>
        <Text style={styles.listLine}>{barber ? `Barbero: ${barber.displayName}` : 'Sin barberos'}</Text>
        <Field label="Fecha y hora" onChangeText={setStartValue} placeholder="YYYY-MM-DD HH:mm" value={startValue} />
        <PrimaryButton label="Solicitar cita" onPress={() => void submitAppointment()} />
      </View>
    </ScreenFrame>
  );
}

function ClientAppointmentsScreen({ context }: { context: ScreenContext }) {
  async function cancel(appointment: Appointment) {
    if (!canEditAppointment(appointment)) {
      context.onMessage('Esta cita ya no se puede cancelar desde cliente.');
      return;
    }
    await transitionAppointment(appointment.id, 'cancelled');
    await context.refresh();
  }

  return (
    <ScreenFrame context={context} title="Mis citas">
      {context.data.clientAppointments.map((appointment) => (
        <View key={appointment.id} style={styles.panel}>
          <Text style={styles.panelTitle}>{appointment.serviceName}</Text>
          <Text style={styles.listLine}>{appointment.barberName} · {formatDateTime(appointment.startAt)}</Text>
          <Text style={styles.badge}>{appointment.status}</Text>
          <PrimaryButton label="Cancelar" onPress={() => void cancel(appointment)} />
        </View>
      ))}
    </ScreenFrame>
  );
}

function AgendaScreen({ context }: { context: ScreenContext }) {
  const sortedAppointments = [...context.data.appointments].sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  async function changeStatus(appointment: Appointment, status: 'confirmed' | 'rejected' | 'completed') {
    if (!canTransitionAppointment(appointment.status, status)) {
      Alert.alert('Cambio no permitido', 'La cita ya no acepta ese cambio de estado.');
      return;
    }
    await transitionAppointment(appointment.id, status);
    await context.refresh();
  }

  return (
    <ScreenFrame context={context} title="Agenda por barbero">
      <PrimaryButton label="Recargar agenda" onPress={() => void context.refresh()} />
      {context.data.barbers.map((barber) => (
        <View key={barber.id} style={styles.panel}>
          <Text style={styles.panelTitle}>{barber.displayName}</Text>
          {sortedAppointments.filter((appointment) => appointment.barberId === barber.id).map((appointment) => (
            <View key={appointment.id} style={styles.agendaRow}>
              <View style={styles.agendaText}>
                <Text style={styles.listLine}>{formatDateTime(appointment.startAt)} · {appointment.serviceName}</Text>
                <Text style={styles.muted}>{appointment.clientName} · {appointment.status}</Text>
              </View>
              <Pressable onPress={() => void changeStatus(appointment, 'confirmed')} style={styles.smallAction}>
                <Text style={styles.smallActionText}>OK</Text>
              </Pressable>
              <Pressable onPress={() => void changeStatus(appointment, 'rejected')} style={styles.smallActionMuted}>
                <Text style={styles.smallActionText}>NO</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </ScreenFrame>
  );
}

function ReportsScreen({ context }: { context: ScreenContext }) {
  const report = buildWeeklyOccupancyReport(context.data.appointments);

  return (
    <ScreenFrame context={context} title="Reporte semanal">
      <View style={styles.heroBand}>
        <Text style={styles.heroTitle}>{report.appointmentCount} citas</Text>
        <Text style={styles.heroText}>{report.occupiedMinutes} min ocupados · ${report.estimatedRevenue}</Text>
      </View>
      {report.byBarber.map((barber) => (
        <View key={barber.barberId} style={styles.panel}>
          <Text style={styles.panelTitle}>{barber.barberName}</Text>
          <Text style={styles.listLine}>{barber.appointmentCount} citas · {barber.occupiedMinutes} min · ${barber.estimatedRevenue}</Text>
        </View>
      ))}
    </ScreenFrame>
  );
}

function ProfileScreen({ onSignOut, profile }: { onSignOut: () => void; profile: UserProfile }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>Perfil</Text>
      <Text style={styles.screenTitle}>{profile.displayName || 'Usuario TapFade'}</Text>
      <Text style={styles.listLine}>{profile.email}</Text>
      <Text style={styles.badge}>{profile.role}</Text>
      <PrimaryButton label="Cerrar sesion" onPress={onSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  agendaRow: {
    alignItems: 'center',
    borderTopColor: colors.coolGrey,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  agendaText: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mint,
    borderRadius: 7,
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 12,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  eyebrow: {
    color: colors.blue,
    fontFamily: typography.bodyBlack,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  heroBand: {
    backgroundColor: colors.graphite,
    borderRadius: 8,
    padding: spacing.xl,
  },
  heroText: {
    color: colors.coolGrey,
    fontFamily: typography.body,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  heroTitle: {
    color: colors.surface,
    fontFamily: typography.display,
    fontSize: 24,
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
  listLine: {
    color: colors.graphite,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  muted: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
  },
  notice: {
    backgroundColor: colors.smoke,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.steel,
    fontFamily: typography.bodyBold,
    padding: spacing.md,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  panelTitle: {
    color: colors.graphite,
    fontFamily: typography.displayBold,
    fontSize: 17,
  },
  screen: {
    backgroundColor: colors.smoke,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    color: colors.graphite,
    fontFamily: typography.display,
    fontSize: 28,
  },
  smallAction: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 7,
    height: 36,
    justifyContent: 'center',
    width: 44,
  },
  smallActionMuted: {
    alignItems: 'center',
    backgroundColor: colors.steel,
    borderRadius: 7,
    height: 36,
    justifyContent: 'center',
    width: 44,
  },
  smallActionText: {
    color: colors.surface,
    fontFamily: typography.bodyBlack,
    fontSize: 12,
  },
});
