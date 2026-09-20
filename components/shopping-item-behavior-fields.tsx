import { AisleCategory } from '@/api/types';
import { AisleHeader } from '@/components/aisle-header';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { ProductBehavior, ProductBehaviorSelector, TrackingUnitSelect } from '@/components/product-behavior-selector';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ReminderFrequencyFields, ReminderFrequencyUnit } from '@/components/reminder-frequency-fields';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { StyleSheet, View } from 'react-native';

export type ShoppingItemBehaviorField =
  | 'pack_sizes'
  | 'aisle'
  | 'unit'
  | 'reminder_frequency_value'
  | 'reminder_frequency_unit';

type ShoppingItemBehaviorFieldsProps = {
  mode: ProductBehavior;
  aisle: AisleCategory;
  unit: Unit;
  reminderValue: string;
  reminderUnit: ReminderFrequencyUnit;
  onModeChange: (mode: ProductBehavior) => void;
  onAislePress: () => void;
  onUnitPress: () => void;
  onReminderValueChange: (value: string) => void;
  onReminderUnitChange: (unit: ReminderFrequencyUnit) => void;
  errors?: Partial<Record<ShoppingItemBehaviorField, string | null>>;
  registerControl?: (field: ShoppingItemBehaviorField, node: View | null) => void;
};

const ControlError = ({
  message,
  fields,
  registerControl,
}: {
  message?: string | null;
  fields: ShoppingItemBehaviorField[];
  registerControl?: ShoppingItemBehaviorFieldsProps['registerControl'];
}) =>
  message ? (
    <View
      ref={(node) => fields.forEach((field) => registerControl?.(field, node))}
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
    >
      <Typography variant="body-xs" weight="medium" color={colors.red[500]} style={styles.error}>
        {message}
      </Typography>
    </View>
  ) : null;

export const ShoppingItemBehaviorFields = ({
  mode,
  aisle,
  unit,
  reminderValue,
  reminderUnit,
  onModeChange,
  onAislePress,
  onUnitPress,
  onReminderValueChange,
  onReminderUnitChange,
  errors = {},
  registerControl,
}: ShoppingItemBehaviorFieldsProps) => (
  <View style={styles.container}>
    <ProductBehaviorSelector value={mode} onChange={onModeChange} />

    {mode !== 'kitchen_basic' ? (
      <View>
        <Typography variant="body-sm" weight="bold" style={styles.label}>
          Category
        </Typography>
        <PressableWithHaptics onPress={onAislePress}>
          <AisleHeader type={aisle} showEditIndicator />
        </PressableWithHaptics>
        <ControlError message={errors.aisle} fields={['aisle']} registerControl={registerControl} />
      </View>
    ) : null}

    {mode === 'tracked' ? (
      <View>
        <TrackingUnitSelect unit={unit} onPress={onUnitPress} />
        <ControlError message={errors.unit} fields={['unit']} registerControl={registerControl} />
      </View>
    ) : null}

    {mode === 'timed' ? (
      <View>
        <ReminderFrequencyFields
          value={reminderValue}
          unit={reminderUnit}
          onValueChange={onReminderValueChange}
          onUnitChange={onReminderUnitChange}
        />
        <ControlError
          message={errors.reminder_frequency_value ?? errors.reminder_frequency_unit}
          fields={['reminder_frequency_value', 'reminder_frequency_unit']}
          registerControl={registerControl}
        />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  label: {
    marginBottom: 4,
  },
  error: {
    marginTop: 4,
  },
});
