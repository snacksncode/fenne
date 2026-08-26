import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { CalendarDays, Minus, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export type ReminderFrequencyUnit = 'days' | 'weeks' | 'months';

type ReminderFrequencyFieldsProps = {
  value: string;
  unit: ReminderFrequencyUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: ReminderFrequencyUnit) => void;
};

const units: ReminderFrequencyUnit[] = ['days', 'weeks', 'months'];

const parsedFrequency = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const unitLabel = (unit: ReminderFrequencyUnit, value: number) =>
  value === 1 ? unit.slice(0, -1) : unit;

const reminderSummary = (value: number, unit: ReminderFrequencyUnit) =>
  value === 1
    ? `We’ll remind you about once a ${unitLabel(unit, value)}.`
    : `We’ll remind you about every ${value} ${unitLabel(unit, value)}.`;

export const ReminderFrequencyFields = ({
  value,
  unit,
  onValueChange,
  onUnitChange,
}: ReminderFrequencyFieldsProps) => {
  const frequency = parsedFrequency(value);

  return (
    <View style={styles.container}>
      <Typography variant="body-sm" weight="bold">
        Reminder frequency
      </Typography>

      <View style={styles.unitSelector} accessibilityRole="radiogroup">
        {units.map((option, index) => {
          const selected = unit === option;
          return (
            <PressableWithHaptics
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option}
              onPress={() => onUnitChange(option)}
              style={[
                styles.unitOption,
                index > 0 && styles.unitOptionDivider,
                selected && styles.selectedUnitOption,
              ]}
            >
              <Typography
                variant="body-sm"
                weight="bold"
                color={selected ? colors.cream[100] : colors.brown[900]}
                style={styles.capitalize}
              >
                {option}
              </Typography>
            </PressableWithHaptics>
          );
        })}
      </View>

      <View style={styles.stepper}>
        <PressableWithHaptics
          accessibilityRole="button"
          accessibilityLabel="Decrease reminder frequency"
          accessibilityState={{ disabled: frequency === 1 }}
          disabled={frequency === 1}
          onPress={() => onValueChange(String(Math.max(1, frequency - 1)))}
          style={[styles.stepperButton, frequency === 1 && styles.disabledButton]}
        >
          <Minus size={20} strokeWidth={2.25} color={colors.brown[900]} />
        </PressableWithHaptics>
        <Typography variant="heading-sm" weight="bold">
          {frequency}
        </Typography>
        <PressableWithHaptics
          accessibilityRole="button"
          accessibilityLabel="Increase reminder frequency"
          onPress={() => onValueChange(String(frequency + 1))}
          style={styles.stepperButton}
        >
          <Plus size={20} strokeWidth={2.25} color={colors.brown[900]} />
        </PressableWithHaptics>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <CalendarDays size={16} strokeWidth={2.25} color={colors.brown[900]} />
        </View>
        <Typography variant="body-xs" weight="medium" color={colors.brown[900]} style={styles.summaryCopy}>
          {reminderSummary(frequency, unit)}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  unitSelector: {
    backgroundColor: colors.cream[50],
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  unitOption: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  unitOptionDivider: {
    borderLeftColor: colors.brown[900],
    borderLeftWidth: 1,
  },
  selectedUnitOption: {
    backgroundColor: colors.orange[500],
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.cream[50],
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 12,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: colors.surface.raised,
    borderColor: colors.border.muted,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  disabledButton: {
    opacity: 0.4,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  summaryIcon: {
    alignItems: 'center',
    borderColor: colors.border.muted,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  summaryCopy: {
    flex: 1,
  },
});
