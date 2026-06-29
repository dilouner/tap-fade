import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type InputFieldProps = {
  icon: string;
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (value: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password';
  inputMode?: 'email';
  showToggle?: boolean;
  onTogglePress?: () => void;
  isSecureVisible?: boolean;
};

export function InputField({
  icon,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  autoCapitalize,
  autoComplete,
  inputMode,
  showToggle,
  onTogglePress,
  isSecureVisible,
}: InputFieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
      {showToggle ? (
        <Pressable hitSlop={8} onPress={onTogglePress} style={styles.toggle}>
          <Text style={styles.toggleText}>{isSecureVisible ? 'Ocultar' : 'Ver'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.coolGrey,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    shadowColor: colors.blueDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: colors.smoke,
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  iconText: {
    color: colors.blue,
    fontFamily: typography.bodyBlack,
    fontSize: 18,
  },
  input: {
    color: colors.graphite,
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    minHeight: 56,
    paddingVertical: 0,
  },
  toggle: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  toggleText: {
    color: colors.muted,
    fontFamily: typography.bodyBold,
    fontSize: 12,
  },
});
