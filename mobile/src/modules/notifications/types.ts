export type NotificationType =
  | 'appointment_requested'
  | 'appointment_confirmed'
  | 'appointment_rejected'
  | 'appointment_cancelled'
  | 'reschedule_requested'
  | 'reschedule_accepted'
  | 'reschedule_rejected'
  | 'invitation_accepted'
  | 'system';

export type AppNotification = {
  id: string;
  recipientId: string;
  actorId: string;
  appointmentId: string | null;
  title: string;
  body: string;
  type: NotificationType;
  revision: number;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'readAt'>;
