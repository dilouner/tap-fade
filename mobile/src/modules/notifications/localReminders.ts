import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Appointment } from '../appointments/types';

const CHANNEL_ID = 'appointments';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureLocalNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Citas y recordatorios',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function syncAppointmentReminders(appointments: Appointment[]) {
  await configureLocalNotifications();
  const confirmed = appointments.filter((item) => item.status === 'confirmed');
  let permission = await Notifications.getPermissionsAsync();
  if (confirmed.length > 0 && permission.status !== 'granted' && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  const granted = permission.status === 'granted';
  if (!granted) return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const appointmentIds = new Set(appointments.map((appointment) => appointment.id));
  await Promise.all(existing
    .filter((item) => typeof item.content.data?.appointmentId === 'string' && !appointmentIds.has(item.content.data.appointmentId))
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));

  const current = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(current
    .filter((item) => typeof item.content.data?.appointmentId === 'string' && appointmentIds.has(item.content.data.appointmentId))
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));

  const now = Date.now();
  for (const appointment of confirmed) {
    for (const offsetHours of [24, 2]) {
      const reminderAt = new Date(appointment.startAt.getTime() - offsetHours * 60 * 60 * 1000);
      if (reminderAt.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: offsetHours === 24 ? 'Tu cita es mañana' : 'Tu cita es en 2 horas',
          body: `${appointment.serviceName} con ${appointment.barberName}`,
          data: { appointmentId: appointment.id },
          sound: 'default',
        },
        trigger: { channelId: CHANNEL_ID, date: reminderAt, type: Notifications.SchedulableTriggerInputTypes.DATE },
      });
    }
  }
}

export async function clearAppointmentReminders() {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing
    .filter((item) => typeof item.content.data?.appointmentId === 'string')
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
