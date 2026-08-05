import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { listAllAppointments, listBarberAppointments, listClientAppointments, listShopAppointments, subscribeBarberAppointments, subscribeClientAppointments, subscribeShopAppointments } from '../modules/appointments/appointmentRepository';
import type { Appointment } from '../modules/appointments/types';
import { listShopAvailability } from '../modules/availability/availabilityRepository';
import type { AvailabilityBlock } from '../modules/availability/types';
import { getBarberShopById, getOwnerBarberShop, listActiveBarberShops, listAllBarberShops, listShopBarbers } from '../modules/barber-shops/barberShopRepository';
import type { Barber, BarberShop } from '../modules/barber-shops/types';
import { syncAppointmentReminders } from '../modules/notifications/localReminders';
import { listNotifications, subscribeNotifications } from '../modules/notifications/notificationRepository';
import type { AppNotification } from '../modules/notifications/types';
import { listShopServices } from '../modules/services/serviceRepository';
import type { BarberService } from '../modules/services/types';
import { listUsers } from '../modules/users/userProfileRepository';
import type { AppMode, UserProfile } from '../modules/users/types';

export type AppData = {
  activeBarber: Barber | null;
  activeShop: BarberShop | null;
  appointments: Appointment[];
  availability: AvailabilityBlock[];
  barbers: Barber[];
  clientAppointments: Appointment[];
  notifications: AppNotification[];
  services: BarberService[];
  shops: BarberShop[];
  users: UserProfile[];
};

type AppContextValue = {
  data: AppData;
  error: string | null;
  loading: boolean;
  mode: AppMode;
  profile: UserProfile | null;
  refresh: () => Promise<void>;
  setMode: (mode: AppMode) => void;
  unreadNotifications: number;
};

const emptyData: AppData = {
  activeBarber: null,
  activeShop: null,
  appointments: [],
  availability: [],
  barbers: [],
  clientAppointments: [],
  notifications: [],
  services: [],
  shops: [],
  users: [],
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppDataProvider({ children, profile }: { children: ReactNode; profile: UserProfile | null }) {
  const [selectedMode, setModeState] = useState<AppMode>('client');
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableModes = useMemo(() => profile?.roles ?? ['client'], [profile?.roles]);
  const mode: AppMode = availableModes.includes(selectedMode) ? selectedMode : 'client';
  const setMode = useCallback((next: AppMode) => {
    if (availableModes.includes(next)) setModeState(next);
  }, [availableModes]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const failures: string[] = [];
    async function safely<T>(operation: Promise<T>, fallback: T, label: string): Promise<T> {
      try { return await operation; }
      catch (caught) {
        failures.push(`${label}: ${caught instanceof Error ? caught.message : 'no disponible'}`);
        return fallback;
      }
    }
    try {
      const shops = await safely(mode === 'admin' && profile ? listAllBarberShops() : listActiveBarberShops(), [], 'Negocios');
      const clientAppointments = profile ? await safely(listClientAppointments(profile.uid), [], 'Citas') : [];
      const users = mode === 'admin' && profile ? await safely(listUsers(), [], 'Usuarios') : [];
      const notifications = profile ? await safely(listNotifications(profile.uid), [], 'Notificaciones') : [];
      let activeShop: BarberShop | null = null;
      let activeBarber: Barber | null = null;

      if (profile && mode === 'owner') {
        activeShop = profile.ownerShopId
          ? await safely(getBarberShopById(profile.ownerShopId), null, 'Tu negocio')
          : await safely(getOwnerBarberShop(profile.uid), null, 'Tu negocio');
      }
      if (profile && mode === 'barber') {
        const candidates = profile.barberShopId
          ? [await safely(getBarberShopById(profile.barberShopId), null, 'Tu negocio')].filter((item): item is BarberShop => Boolean(item))
          : shops;
        for (const shop of candidates) {
          const shopBarbers = await listShopBarbers(shop.id);
          const match = shopBarbers.find((barber) => barber.userId === profile.uid);
          if (match) {
            activeBarber = match;
            activeShop = shop;
            break;
          }
        }
      }

      const [services, barbers, availability] = activeShop
        ? await Promise.all([
          safely(listShopServices(activeShop.id), [], 'Servicios'),
          safely(listShopBarbers(activeShop.id), [], 'Barberos'),
          safely(listShopAvailability(activeShop.id), [], 'Disponibilidad'),
        ])
        : [[], [], []];
      if (!activeBarber && profile) activeBarber = barbers.find((barber) => barber.userId === profile.uid) ?? null;

      let appointments: Appointment[] = [];
      if (profile && mode === 'admin') appointments = await safely(listAllAppointments(), [], 'Citas operativas');
      else if (activeShop && mode === 'barber' && activeBarber) appointments = await safely(listBarberAppointments(activeShop.id, activeBarber.id), [], 'Agenda');
      else if (activeShop) appointments = await safely(listShopAppointments(activeShop.id), [], 'Agenda');

      setData({ activeBarber, activeShop, appointments, availability, barbers, clientAppointments, notifications, services, shops, users });
      if (failures.length) setError(failures[0]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible actualizar TapFade.');
    } finally {
      setLoading(false);
    }
  }, [mode, profile]);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!profile) return;
    const report = () => setError('La actualización en tiempo real se interrumpió. Desliza para reintentar.');
    const stopAppointments = subscribeClientAppointments(profile.uid, (clientAppointments) => {
      setData((current) => ({ ...current, clientAppointments }));
    }, report);
    const stopNotifications = subscribeNotifications(profile.uid, (notifications) => {
      setData((current) => ({ ...current, notifications }));
    }, report);
    return () => { stopAppointments(); stopNotifications(); };
  }, [profile]);

  useEffect(() => {
    if (!profile || !data.activeShop || !['owner', 'barber'].includes(mode)) return;
    const report = () => setError('No fue posible mantener la agenda actualizada.');
    return mode === 'barber' && data.activeBarber
      ? subscribeBarberAppointments(data.activeShop.id, data.activeBarber.id, (appointments) => setData((current) => ({ ...current, appointments })), report)
      : subscribeShopAppointments(data.activeShop.id, (appointments) => setData((current) => ({ ...current, appointments })), report);
  }, [data.activeBarber, data.activeShop, mode, profile]);

  useEffect(() => {
    if (!profile) return;
    void syncAppointmentReminders(data.clientAppointments);
  }, [data.clientAppointments, profile]);

  const unreadNotifications = useMemo(() => data.notifications.filter((item) => !item.readAt).length, [data.notifications]);
  const value = useMemo(() => ({ data, error, loading, mode, profile, refresh, setMode, unreadNotifications }), [data, error, loading, mode, profile, refresh, setMode, unreadNotifications]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
}
