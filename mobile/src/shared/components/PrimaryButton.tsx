import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, typography } from '../theme';

type PrimaryButtonProps = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

export function PrimaryButton({ label, disabled, loading, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} size="small" testID="primary-button-loading" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    shadowColor: colors.blueDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
  },
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
  },
});
