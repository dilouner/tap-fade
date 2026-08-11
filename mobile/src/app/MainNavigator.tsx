import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppData, AppDataProvider } from './AppContext';
import type { RoleTabParamList, RootStackParamList } from './navigationTypes';
import { AdminAppointmentsScreen, AdminHomeScreen, AdminShopDetailScreen, AdminShopsScreen, AdminUserDetailScreen, AdminUsersScreen } from './screens/AdminScreens';
import { BarberHomeScreen, BarberRequestsScreen } from './screens/BarberScreens';
import { BookingScreen, ClientAppointmentsScreen, ClientHomeScreen, ExploreScreen, ShopDetailScreen } from './screens/ClientScreens';
import { AvailabilityEditScreen, BarberEditScreen, BusinessEditScreen, BusinessScreen, InviteBarberScreen, OperatorAgendaScreen, OwnerDashboardScreen, RedeemInviteScreen, ServiceEditScreen } from './screens/OwnerScreens';
import { AppointmentDetailScreen, type AuthActions, AuthScreen, NotificationsScreen, ProfileEditScreen, ProfileScreen } from './screens/SharedScreens';
import type { UserProfile } from '../modules/users/types';
import { colors, spacing, typography } from '../shared/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RoleTabParamList>();

type Props = { profile: UserProfile | null; authError: string | null; actions: AuthActions };

function AppHeaderActions({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { profile, unreadNotifications } = useAppData();
  return (
    <View style={styles.headerActions}>
      <Pressable accessibilityLabel="Abrir notificaciones" hitSlop={10} onPress={() => navigation.navigate(profile ? 'Notifications' : 'Auth')} style={styles.headerButton}>
        <Ionicons color={colors.ink} name="notifications-outline" size={22} />
        {unreadNotifications > 0 ? <View style={styles.unreadDot} /> : null}
      </Pressable>
      <Pressable accessibilityLabel={profile ? 'Abrir perfil' : 'Iniciar sesión'} hitSlop={10} onPress={() => navigation.navigate(profile ? 'Profile' : 'Auth')} style={styles.avatar}>
        <Text style={styles.avatarText}>{profile?.displayName?.trim()?.[0]?.toUpperCase() ?? 'TF'}</Text>
      </Pressable>
    </View>
  );
}

function TabIcon({ route, focused }: { route: keyof RoleTabParamList; focused: boolean }) {
  const icons: Record<keyof RoleTabParamList, keyof typeof Ionicons.glyphMap> = {
    Home: focused ? 'home' : 'home-outline', Explore: focused ? 'compass' : 'compass-outline', Schedule: focused ? 'calendar' : 'calendar-outline',
    Business: focused ? 'storefront' : 'storefront-outline', People: focused ? 'people' : 'people-outline', Shops: focused ? 'business' : 'business-outline',
    Appointments: focused ? 'cut' : 'cut-outline', Profile: focused ? 'person' : 'person-outline',
  };
  return <Ionicons color={focused ? colors.blue : colors.muted} name={icons[route]} size={23} />;
}

function RoleTabs({ actions }: { actions: AuthActions }) {
  const { mode } = useAppData();
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator screenOptions={({ navigation, route }) => ({
      headerShadowVisible: false, headerStyle: { backgroundColor: colors.surface }, headerTitle: '',
      headerLeft: () => <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandMarkText}>TF</Text></View><Text style={styles.brandText}>TapFade</Text></View>,
      headerRight: () => <AppHeaderActions navigation={navigation.getParent() as NativeStackNavigationProp<RootStackParamList>} />,
      tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: styles.tabLabel,
      tabBarStyle: [styles.tabBar, { height: 62 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) }],
      tabBarIcon: ({ focused }) => <TabIcon focused={focused} route={route.name} />,
    })}>
      {mode === 'client' ? <>
        <Tabs.Screen component={ClientHomeScreen} name="Home" options={{ title: 'Inicio' }} />
        <Tabs.Screen component={ExploreScreen} name="Explore" options={{ title: 'Explorar' }} />
        <Tabs.Screen component={ClientAppointmentsScreen} name="Schedule" options={{ title: 'Citas' }} />
        <Tabs.Screen name="Profile" options={{ title: 'Perfil' }}>{({ navigation }) => <ProfileScreen actions={actions} onNavigate={(destination) => navigation.getParent()?.navigate(destination)} />}</Tabs.Screen>
      </> : null}
      {mode === 'barber' ? <>
        <Tabs.Screen component={BarberHomeScreen} name="Home" options={{ title: 'Hoy' }} />
        <Tabs.Screen component={OperatorAgendaScreen} name="Schedule" options={{ title: 'Agenda' }} />
        <Tabs.Screen component={AvailabilityEditScreen} name="Business" options={{ title: 'Disponibilidad' }} />
        <Tabs.Screen name="Profile" options={{ title: 'Perfil' }}>{({ navigation }) => <ProfileScreen actions={actions} onNavigate={(destination) => navigation.getParent()?.navigate(destination)} />}</Tabs.Screen>
      </> : null}
      {mode === 'owner' ? <>
        <Tabs.Screen component={OwnerDashboardScreen} name="Home" options={{ title: 'Resumen' }} />
        <Tabs.Screen component={OperatorAgendaScreen} name="Schedule" options={{ title: 'Agenda' }} />
        <Tabs.Screen component={BusinessScreen} name="Business" options={{ title: 'Negocio' }} />
        <Tabs.Screen name="Profile" options={{ title: 'Perfil' }}>{({ navigation }) => <ProfileScreen actions={actions} onNavigate={(destination) => navigation.getParent()?.navigate(destination)} />}</Tabs.Screen>
      </> : null}
      {mode === 'admin' ? <>
        <Tabs.Screen component={AdminHomeScreen} name="Home" options={{ title: 'Resumen' }} />
        <Tabs.Screen component={AdminUsersScreen} name="People" options={{ title: 'Usuarios' }} />
        <Tabs.Screen component={AdminShopsScreen} name="Shops" options={{ title: 'Negocios' }} />
        <Tabs.Screen component={AdminAppointmentsScreen} name="Appointments" options={{ title: 'Citas' }} />
      </> : null}
    </Tabs.Navigator>
  );
}

export function MainNavigator({ profile, authError, actions }: Props) {
  return <AppDataProvider profile={profile}><NavigationContainer><Stack.Navigator screenOptions={{ headerBackTitle: 'Atrás', headerShadowVisible: false, headerTintColor: colors.ink }}>
    <Stack.Screen name="Tabs" options={{ headerShown: false }}>{() => <RoleTabs actions={actions} />}</Stack.Screen>
    <Stack.Screen name="Auth" options={{ headerShown: false }}>{(props) => <AuthScreen {...props} actions={actions} error={authError} />}</Stack.Screen>
    <Stack.Screen component={NotificationsScreen} name="Notifications" options={{ title: 'Notificaciones' }} />
    <Stack.Screen name="Profile" options={{ title: 'Mi perfil' }}>{({ navigation }) => <ProfileScreen actions={actions} onNavigate={(destination) => navigation.navigate(destination)} />}</Stack.Screen>
    <Stack.Screen component={ProfileEditScreen} name="ProfileEdit" options={{ title: 'Editar perfil' }} />
    <Stack.Screen component={ShopDetailScreen} name="ShopDetail" options={{ title: 'Barbería' }} />
    <Stack.Screen component={BookingScreen} name="Booking" options={{ title: 'Reservar' }} />
    <Stack.Screen component={AppointmentDetailScreen} name="AppointmentDetail" options={{ title: 'Detalle de cita' }} />
    <Stack.Screen component={BusinessEditScreen} name="BusinessEdit" options={{ title: 'Configurar negocio' }} />
    <Stack.Screen component={ServiceEditScreen} name="ServiceEdit" options={{ title: 'Servicio' }} />
    <Stack.Screen component={BarberEditScreen} name="BarberEdit" options={{ title: 'Barbero' }} />
    <Stack.Screen component={AvailabilityEditScreen} name="AvailabilityEdit" options={{ title: 'Disponibilidad' }} />
    <Stack.Screen component={InviteBarberScreen} name="InviteBarber" options={{ title: 'Invitar barbero' }} />
    <Stack.Screen component={RedeemInviteScreen} name="RedeemInvite" options={{ title: 'Unirme a un negocio' }} />
    <Stack.Screen component={AdminUserDetailScreen} name="AdminUserDetail" options={{ title: 'Usuario' }} />
    <Stack.Screen component={AdminShopDetailScreen} name="AdminShopDetail" options={{ title: 'Negocio' }} />
    <Stack.Screen component={BarberRequestsScreen} name="BarberRequests" options={{ title: 'Solicitudes' }} />
  </Stack.Navigator></NavigationContainer></AppDataProvider>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.mint, borderRadius: 999, height: 36, justifyContent: 'center', width: 36 },
  avatarText: { color: colors.ink, fontFamily: typography.displayBold, fontSize: 12 },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginLeft: spacing.md },
  brandMark: { alignItems: 'center', backgroundColor: colors.blue, borderRadius: 10, height: 32, justifyContent: 'center', width: 32 },
  brandMarkText: { color: colors.surface, fontFamily: typography.display, fontSize: 11 },
  brandText: { color: colors.ink, fontFamily: typography.displayBold, fontSize: 18 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginRight: spacing.md },
  headerButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  tabBar: { borderTopColor: colors.coolGrey, height: 70, paddingBottom: 8, paddingTop: 6 },
  tabLabel: { fontFamily: typography.bodyBold, fontSize: 11 },
  unreadDot: { backgroundColor: colors.danger, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 10, position: 'absolute', right: 4, top: 3, width: 10 },
});
