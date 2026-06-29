import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type SocialButtonProps = {
  icon: string;
  label: string;
  onPress?: () => void;
};

export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 56,
    justifyContent: 'center',
    shadowColor: colors.blueDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.graphite,
    fontFamily: typography.bodyBlack,
    fontSize: 20,
  },
  label: {
    color: colors.graphite,
    fontFamily: typography.bodyBold,
    fontSize: 16,
  },
});
