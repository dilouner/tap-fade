import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AppointmentStatus } from '../../modules/appointments/types';
import { colors, spacing, typography } from '../theme';

export const shopImageFallback = require('../../../assets/brand-digital-applications.png');
export const barberImageFallback = require('../../../assets/logo-symbol-color.png');

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
    return <View style={[styles.screen, dark && styles.darkScreen]}>{content}</View>;
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, dark && styles.darkScreen]} showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
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

export function StatusPill({ status }: { status: AppointmentStatus | 'active' | 'inactive' }) {
  const tone = status === 'confirmed' || status === 'completed' || status === 'active'
    ? styles.pillSuccess
    : status === 'pending'
      ? styles.pillWarning
      : styles.pillDanger;

  return (
    <View style={[styles.pill, tone]}>
      <Text style={styles.pillText}>{status}</Text>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
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
          <Pressable key={slot} onPress={() => onSelect(slot)} style={[styles.timeSlot, active && styles.timeSlotActive]}>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mediaCard, pressed && styles.pressed]}>
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
    <Pressable onPress={onPress} style={[styles.rowCard, selected && styles.selectedCard]}>
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
    <Pressable onPress={onPress} style={[styles.rowCard, selected && styles.selectedCard]}>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.appointmentCard, pressed && styles.pressed]}>
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

export const uiStyles = styles;

const styles = StyleSheet.create({
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
