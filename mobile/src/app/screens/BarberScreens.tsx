import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';

import { useAppData } from '../AppContext';
import type { RootStackParamList } from '../navigationTypes';
import { AppointmentCard, Banner, EmptyState, LoadingState, PremiumHero, Screen, SectionHeader } from '../../shared/components/AppUI';
import { PrimaryButton } from '../../shared/components/PrimaryButton';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function BarberHomeScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  if (!data.activeShop || !data.activeBarber) return <Screen eyebrow="Barbero" title="Vincula tu lugar de trabajo"><EmptyState icon="key-outline" message="Pide un código al dueño de la barbería y úsalo desde tu perfil." title="Sin barbería vinculada" /></Screen>;
  const today = data.appointments.filter((item) => item.startAt.toDateString() === new Date().toDateString()).sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
  const pending = data.appointments.filter((item) => item.status === 'pending');
  return <Screen eyebrow="Barbero" title={`Hola, ${data.activeBarber.displayName.split(' ')[0]}`}><PremiumHero eyebrow={data.activeShop.name} subtitle={`${pending.length} solicitudes pendientes de respuesta.`} title={today.length ? `${today.length} citas para hoy` : 'Hoy tienes la agenda libre'} />{pending.length ? <Banner message="Responde las solicitudes pronto para que tus clientes puedan organizarse." /> : null}<SectionHeader subtitle="Ordenadas por hora" title="Agenda de hoy" />{today.length ? today.map((item) => <AppointmentCard client={item.clientName} date={item.startAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} key={item.id} onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id, source: 'operator' })} service={item.serviceName} status={item.status} />) : <EmptyState message="Configura bloqueos o revisa los próximos días desde Agenda." title="Sin citas hoy" />}<PrimaryButton label="Gestionar disponibilidad" onPress={() => navigation.navigate('AvailabilityEdit')} variant="secondary" /></Screen>;
}

export function BarberRequestsScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  const pending = data.appointments.filter((item) => item.status === 'pending' || item.rescheduleRequest);
  return <Screen eyebrow="Solicitudes" title="Por responder">{pending.length ? pending.map((item) => <AppointmentCard client={item.clientName} date={item.startAt.toLocaleString('es-MX')} key={item.id} onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id, source: 'operator' })} service={item.serviceName} status={item.status} />) : <EmptyState icon="checkmark-done-outline" message="No tienes solicitudes pendientes." title="Todo al día" />}</Screen>;
}
