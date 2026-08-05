import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, typography } from '../theme';

type PrimaryButtonProps = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export function PrimaryButton({ label, disabled, icon, loading, onPress, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(disabled || loading) }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.graphite : colors.surface} size="small" testID="primary-button-loading" />
      ) : (
        <>
          {icon ? <Ionicons color={variant === 'secondary' || variant === 'ghost' ? colors.graphite : colors.surface} name={icon} size={19} /> : null}
          <Text adjustsFontSizeToFit numberOfLines={2} style={[styles.label, (variant === 'secondary' || variant === 'ghost') && styles.darkLabel]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 18,
    minHeight: 56,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: colors.blueDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
  },
  danger: { backgroundColor: colors.danger, shadowColor: colors.danger },
  secondary: { backgroundColor: colors.surface, borderColor: colors.coolGrey, borderWidth: 1, shadowOpacity: 0 },
  ghost: { backgroundColor: 'transparent', shadowOpacity: 0 },
  darkLabel: { color: colors.graphite },
  buttonDisabled: {
    opacity: 0.56,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  label: {
    color: colors.surface,
    fontFamily: typography.bodyExtraBold,
    fontSize: 17,
    flexShrink: 1,
    lineHeight: 21,
    textAlign: 'center',
  },
});
