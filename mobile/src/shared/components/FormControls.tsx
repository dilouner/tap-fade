import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { PrimaryButton } from './PrimaryButton';

export function Field({ error, label, multiline, ...props }: TextInputProps & { error?: string; label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityHint={error}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multiline, error && styles.inputError, props.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function SelectField<T extends string>({ label, onChange, options, value }: {
  label: string;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: value === option.value }} key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, value === option.value && styles.chipActive]}>
            <Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type PickerFieldProps = { date: Date; label: string; maximumDate?: Date; minimumDate?: Date; mode: 'date' | 'time'; onChange: (date: Date) => void };

function roundToQuarter(date: Date) {
  const result = new Date(date);
  result.setMinutes(Math.round(result.getMinutes() / 15) * 15, 0, 0);
  return result;
}

function PickerField({ date, label, maximumDate, minimumDate, mode, onChange }: PickerFieldProps) {
  const [show, setShow] = useState(false);
  const display = mode === 'date'
    ? date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        is24Hour: true,
        maximumDate,
        minimumDate: mode === 'date' ? minimumDate ?? new Date() : undefined,
        mode,
        onChange: (_, selected) => selected && onChange(mode === 'time' ? roundToQuarter(selected) : selected),
        value: date,
      });
    } else setShow(true);
  }

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityLabel={`${label}: ${display}`} accessibilityRole="button" onPress={open} style={styles.pickerButton}>
        <Text style={styles.pickerText}>{display}</Text>
        <Ionicons color={colors.blue} name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={20} />
      </Pressable>
      {show ? (
        <View style={styles.iosPicker}>
          <DateTimePicker display={mode === 'date' ? 'inline' : 'spinner'} maximumDate={maximumDate} minimumDate={mode === 'date' ? minimumDate ?? new Date() : undefined} minuteInterval={mode === 'time' ? 15 : undefined} mode={mode} onChange={(_, selected) => selected && onChange(mode === 'time' ? roundToQuarter(selected) : selected)} value={date} />
          <PrimaryButton label="Listo" onPress={() => setShow(false)} />
        </View>
      ) : null}
    </View>
  );
}

export function DateField(props: Omit<React.ComponentProps<typeof PickerField>, 'mode'>) {
  return <PickerField {...props} mode="date" />;
}

export function TimeField(props: Omit<React.ComponentProps<typeof PickerField>, 'mode'>) {
  return <PickerField {...props} mode="time" />;
}

export function ConfirmationDialog({ body, confirmLabel, destructive, onClose, onConfirm, title, visible }: {
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <PrimaryButton label="Volver" onPress={onClose} variant="secondary" />
          <PrimaryButton label={confirmLabel} onPress={onConfirm} variant={destructive ? 'danger' : 'primary'} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(7,10,15,0.56)', flex: 1, justifyContent: 'center', padding: spacing.xl },
  chip: { backgroundColor: colors.surface, borderColor: colors.coolGrey, borderRadius: 14, borderWidth: 1, minHeight: 44, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.graphite, borderColor: colors.graphite },
  chipText: { color: colors.steel, fontFamily: typography.bodyBold, fontSize: 14 },
  chipTextActive: { color: colors.surface },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dialog: { backgroundColor: colors.surface, borderRadius: 24, gap: spacing.md, maxWidth: 440, padding: spacing.xl, width: '100%' },
  dialogBody: { color: colors.steel, fontFamily: typography.body, fontSize: 15, lineHeight: 22 },
  dialogTitle: { color: colors.graphite, fontFamily: typography.displayBold, fontSize: 22 },
  error: { color: colors.danger, fontFamily: typography.body, fontSize: 12 },
  fieldWrap: { gap: spacing.sm },
  input: { backgroundColor: colors.surface, borderColor: colors.coolGrey, borderRadius: 16, borderWidth: 1, color: colors.graphite, fontFamily: typography.body, fontSize: 16, minHeight: 54, paddingHorizontal: spacing.lg },
  inputError: { borderColor: colors.danger },
  iosPicker: { backgroundColor: colors.surface, borderRadius: 18, gap: spacing.md, padding: spacing.md },
  label: { color: colors.graphite, fontFamily: typography.bodyBold, fontSize: 13 },
  multiline: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: 'top' },
  pickerButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.coolGrey, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: spacing.lg },
  pickerText: { color: colors.graphite, fontFamily: typography.body, fontSize: 15 },
});
