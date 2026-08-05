import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Image,
  ActivityIndicator,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AppointmentStatus } from '../../modules/appointments/types';
import { colors, spacing, typography } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const shopImageFallback = require('../../../assets/brand-digital-applications.png');
export const barberImageFallback = require('../../../assets/logo-symbol-color.png');

export function LoadingState({ label = 'Actualizando TapFade…' }: { label?: string }) {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={colors.blue} size="large" />
      <Text style={styles.smallMuted}>{label}</Text>
    </View>
  );
}

export function Banner({ message, tone = 'info' }: { message: string; tone?: 'danger' | 'info' | 'success' }) {
  return (
    <View style={[styles.banner, tone === 'danger' && styles.bannerDanger, tone === 'success' && styles.bannerSuccess]}>
      <Ionicons color={tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.blue} name={tone === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'} size={20} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function PremiumHero({ action, eyebrow, subtitle, title }: { action?: ReactNode; eyebrow: string; subtitle: string; title: string }) {
  return (
    <View style={styles.hero}>
      <View pointerEvents="none" style={styles.heroGlow} />
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
      {action}
    </View>
  );
}

export function SectionHeader({ action, subtitle, title }: { action?: ReactNode; subtitle?: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.rowText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.smallMuted}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

type IconName = ComponentProps<typeof Ionicons>['name'];

type ScreenProps = {
  children: ReactNode;
  dark?: boolean;
  footer?: ReactNode;
  scroll?: boolean;
  title: string;
  eyebrow?: string;
};

export function Screen({ children, dark, eyebrow, footer, scroll = true, title }: ScreenProps) {
  const content = (
    <>
      <View style={styles.screenHeader}>
        {eyebrow ? <Text style={[styles.eyebrow, dark && styles.darkMuted]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, dark && styles.darkTitle]}>{title}</Text>
      </View>
      {children}
      {footer}
    </>
  );

  if (!scroll) {
    return <SafeAreaView edges={['bottom']} style={[styles.screen, styles.screenFlex, dark && styles.darkScreen]}>{content}</SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, dark && styles.darkScreen]}>
      <ScrollView contentContainerStyle={[styles.screen, dark && styles.darkScreen]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

export function TopBar({
  action,
  dark,
  subtitle,
  title,
}: {
  action?: ReactNode;
  dark?: boolean;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={[styles.topTitle, dark && styles.darkTitle]}>{title}</Text>
        {subtitle ? <Text style={[styles.smallMuted, dark && styles.darkMuted]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  tone = 'light',
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  tone?: 'dark' | 'light' | 'primary';
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'dark' && styles.iconButtonDark,
        tone === 'primary' && styles.iconButtonPrimary,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons color={tone === 'primary' || tone === 'dark' ? colors.surface : colors.graphite} name={icon} size={20} />
    </Pressable>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.smallMuted}>{label}</Text>
    </View>
  );
}

export function EmptyState({ action, icon = 'calendar-outline', message, title }: { action?: ReactNode; icon?: IconName; message: string; title: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.blue} name={icon} size={24} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.smallMuted}>{message}</Text>
      {action}
    </View>
  );
}

export function StatusPill({ status }: { status: AppointmentStatus | 'active' | 'inactive' | 'paused' | 'suspended' }) {
  const tone = status === 'confirmed' || status === 'completed' || status === 'active'
    ? styles.pillSuccess
    : status === 'pending'
      ? styles.pillWarning
      : styles.pillDanger;

  return (
    <View style={[styles.pill, tone]}>
      <Text style={styles.pillText}>{statusLabels[status] ?? status}</Text>
    </View>
  );
}

const statusLabels: Record<string, string> = {
  active: 'Activo', cancelled: 'Cancelada', completed: 'Completada', confirmed: 'Confirmada', inactive: 'Inactivo',
  paused: 'Pausado', pending: 'Pendiente', rejected: 'Rechazada', suspended: 'Suspendido',
};

export function SegmentedControl<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TimeSlotGrid({
  onSelect,
  selected,
  slots,
}: {
  onSelect: (slot: string) => void;
  selected: string;
  slots: string[];
}) {
  return (
    <View style={styles.timeGrid}>
      {slots.map((slot) => {
        const active = slot === selected;
        return (
          <Pressable accessibilityLabel={`Horario ${slot}`} accessibilityRole="radio" accessibilityState={{ selected: active }} key={slot} onPress={() => onSelect(slot)} style={[styles.timeSlot, active && styles.timeSlotActive]}>
            <Text style={[styles.timeText, active && styles.timeTextActive]}>{slot}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ShopCard({
  address,
  image,
  name,
  onPress,
}: {
  address: string;
  image?: ImageSourcePropType;
  name: string;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityLabel={`${name}, ${address}`} accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => [styles.mediaCard, pressed && styles.pressed]}>
      <Image resizeMode="cover" source={image ?? shopImageFallback} style={styles.mediaImage} />
      <View style={styles.mediaBody}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text numberOfLines={1} style={styles.smallMuted}>{address}</Text>
      </View>
    </Pressable>
  );
}

export function BarberCard({
  image,
  name,
  onPress,
  selected,
  specialties,
}: {
  image?: ImageSourcePropType;
  name: string;
  onPress?: () => void;
  selected?: boolean;
  specialties: string[];
}) {
  return (
    <Pressable accessibilityLabel={`${name}, ${specialties.join(', ') || 'General'}`} accessibilityRole={onPress ? 'button' : undefined} accessibilityState={onPress ? { selected: Boolean(selected) } : undefined} onPress={onPress} style={[styles.rowCard, selected && styles.selectedCard]}>
      <Image resizeMode="cover" source={image ?? barberImageFallback} style={styles.avatar} />
      <View style={styles.rowText}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text numberOfLines={1} style={styles.smallMuted}>{specialties.join(', ') || 'General'}</Text>
      </View>
      {selected ? <Ionicons color={colors.blue} name="checkmark-circle" size={24} /> : null}
    </Pressable>
  );
}

export function ServiceCard({
  duration,
  name,
  onPress,
  price,
  selected,
}: {
  duration: number;
  name: string;
  onPress?: () => void;
  price: number;
  selected?: boolean;
}) {
  return (
    <Pressable accessibilityLabel={`${name}, ${duration} minutos, ${price} pesos`} accessibilityRole={onPress ? 'button' : undefined} accessibilityState={onPress ? { selected: Boolean(selected) } : undefined} onPress={onPress} style={[styles.rowCard, selected && styles.selectedCard]}>
      <View style={styles.serviceIcon}>
        <Ionicons color={colors.blue} name="cut-outline" size={20} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.smallMuted}>{duration} min</Text>
      </View>
      <Text style={styles.price}>${price}</Text>
    </Pressable>
  );
}

export function AppointmentCard({
  client,
  date,
  onPress,
  primaryAction,
  secondaryAction,
  service,
  status,
}: {
  client: string;
  date: string;
  onPress?: () => void;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  service: string;
  status: AppointmentStatus;
}) {
  return (
    <Pressable accessibilityLabel={`${service}, ${client}, ${date}, ${statusLabels[status]}`} accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => [styles.appointmentCard, pressed && styles.pressed]}>
      <View style={styles.appointmentTop}>
        <View style={styles.rowText}>
          <Text style={styles.cardTitle}>{service}</Text>
          <Text style={styles.smallMuted}>{client}</Text>
        </View>
        <StatusPill status={status} />
      </View>
      <View style={styles.inline}>
        <Ionicons color={colors.muted} name="time-outline" size={16} />
        <Text style={styles.smallMuted}>{date}</Text>
      </View>
      {primaryAction || secondaryAction ? (
        <View style={styles.actionRow}>
          {secondaryAction}
          {primaryAction}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', backgroundColor: colors.blueGlow, borderRadius: 16, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  bannerDanger: { backgroundColor: '#FEE4E2' },
  bannerSuccess: { backgroundColor: '#D9F8EA' },
  bannerText: { color: colors.steel, flex: 1, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 18 },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  appointmentTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: colors.smoke,
    borderRadius: 8,
    height: 56,
    width: 56,
  },
  cardTitle: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 16,
    lineHeight: 21,
  },
  darkMuted: {
    color: colors.coolGrey,
  },
  darkScreen: {
    backgroundColor: colors.ink,
  },
  darkTitle: {
    color: colors.surface,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.blueGlow,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyState: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  hero: { backgroundColor: colors.ink, borderRadius: 24, gap: spacing.md, overflow: 'hidden', padding: spacing.xl },
  heroEyebrow: { color: colors.mint, fontFamily: typography.bodyBlack, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroGlow: { backgroundColor: colors.blue, borderRadius: 160, height: 220, opacity: 0.32, position: 'absolute', right: -100, top: -110, width: 220 },
  heroSubtitle: { color: colors.coolGrey, fontFamily: typography.body, fontSize: 15, lineHeight: 22 },
  heroTitle: { color: colors.surface, fontFamily: typography.display, fontSize: 30, lineHeight: 36, maxWidth: '85%' },
  eyebrow: {
    color: colors.blue,
    fontFamily: typography.bodyBlack,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  iconButtonPrimary: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  inline: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  loadingState: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', minHeight: 240 },
  mediaBody: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  mediaCard: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaImage: {
    backgroundColor: colors.graphite,
    height: 132,
    width: '100%',
  },
  pill: {
    borderRadius: 7,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pillDanger: {
    backgroundColor: '#FEE4E2',
  },
  pillSuccess: {
    backgroundColor: '#D9F8EA',
  },
  pillText: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 11,
  },
  pillWarning: {
    backgroundColor: '#FEF0C7',
  },
  pressed: {
    opacity: 0.82,
  },
  price: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 15,
  },
  rowCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  screen: {
    backgroundColor: colors.smoke,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenHeader: {
    gap: spacing.xs,
  },
  safe: { backgroundColor: colors.smoke, flex: 1 },
  screenFlex: { flex: 1 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  sectionTitle: { color: colors.graphite, fontFamily: typography.displayBold, fontSize: 20 },
  segment: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  segmentActive: {
    backgroundColor: colors.graphite,
  },
  segmentText: {
    color: colors.muted,
    fontFamily: typography.bodyBold,
    fontSize: 13,
  },
  segmentTextActive: {
    color: colors.surface,
  },
  segmented: {
    backgroundColor: colors.coolGrey,
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  selectedCard: {
    borderColor: colors.blue,
    borderWidth: 2,
  },
  serviceIcon: {
    alignItems: 'center',
    backgroundColor: colors.blueGlow,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  smallMuted: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  statValue: {
    color: colors.graphite,
    fontFamily: typography.displayBold,
    fontSize: 22,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    minWidth: '30%',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  timeSlotActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  timeText: {
    color: colors.graphite,
    fontFamily: typography.bodyBold,
    fontSize: 13,
  },
  timeTextActive: {
    color: colors.surface,
  },
  title: {
    color: colors.graphite,
    fontFamily: typography.display,
    fontSize: 28,
    lineHeight: 34,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topTitle: {
    color: colors.graphite,
    fontFamily: typography.displayBold,
    fontSize: 18,
  },
});
