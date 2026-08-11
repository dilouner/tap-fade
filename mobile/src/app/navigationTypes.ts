export type RootStackParamList = {
  Tabs: undefined;
  Auth: { initialMode?: 'signin' | 'signup' } | undefined;
  Notifications: undefined;
  Profile: undefined;
  ShopDetail: { shopId: string };
  Booking: { shopId: string; serviceId?: string };
  AppointmentDetail: { appointmentId: string; source: 'client' | 'operator' | 'admin' };
  ProfileEdit: undefined;
  BusinessEdit: undefined;
  ServiceEdit: { serviceId?: string } | undefined;
  BarberEdit: { barberId?: string } | undefined;
  AvailabilityEdit: undefined;
  InviteBarber: { barberId: string };
  RedeemInvite: undefined;
  AdminUserDetail: { userId: string };
  AdminShopDetail: { shopId: string };
  BarberRequests: undefined;
};

export type RoleTabParamList = {
  Home: undefined;
  Explore: undefined;
  Schedule: undefined;
  Business: undefined;
  People: undefined;
  Shops: undefined;
  Appointments: undefined;
  Profile: undefined;
};
