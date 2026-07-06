import { AisleHeader } from '@/components/aisle-header';
import { UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { StyleSheet, View } from 'react-native';
import { IngredientEditor } from './use-ingredient-editor';

type ProductDraftStepProps = {
  form: IngredientEditor['productForm'];
  onSelectAisle: () => void;
  onSelectUnit: () => void;
};

const CheckRow = ({
  checked,
  label,
  onPress,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const { progress } = useCheckbox(checked);
  return (
    <PressableWithHaptics
      onPress={disabled ? undefined : onPress}
      style={[styles.checkRow, disabled && { opacity: 0.45 }]}
    >
      <Checkbox progress={progress} />
      <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ flex: 1 }}>
        {label}
      </Typography>
    </PressableWithHaptics>
  );
};

export const ProductDraftStep = ({ form, onSelectAisle, onSelectUnit }: ProductDraftStepProps) => (
  <form.AppForm>
    <form.Subscribe selector={(state) => state.values}>
      {(values) => (
        <View style={{ gap: 16 }}>
          <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>

          {values.mode !== 'kitchen_basic' && (
            <form.AppField name="aisle">
              {(field) => (
                <View>
                  <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                    Category
                  </Typography>
                  <PressableWithHaptics onPress={onSelectAisle}>
                    <AisleHeader type={field.state.value} />
                  </PressableWithHaptics>
                </View>
              )}
            </form.AppField>
          )}

          {values.mode !== 'kitchen_basic' && (
            <form.AppField name="pack_count">
              {(field) => <field.NumberField label="Sold in packs of" placeholder="e.g. 12" />}
            </form.AppField>
          )}

          <form.AppField name="mode">
            {(field) => (
              <View style={{ gap: 8 }}>
                <CheckRow
                  checked={field.state.value === 'measured'}
                  label="Track how much is left"
                  disabled={field.state.value === 'timed' || field.state.value === 'kitchen_basic'}
                  onPress={() => field.handleChange(field.state.value === 'measured' ? 'counted' : 'measured')}
                />
                {field.state.value === 'measured' && (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <form.AppField name="quantity">
                        {(quantityField) => <quantityField.NumberField label="Amount" placeholder="e.g. 500" />}
                      </form.AppField>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                        Unit
                      </Typography>
                      <PressableWithHaptics onPress={onSelectUnit}>
                        <View style={styles.unitButton}>
                          <Typography variant="body-sm" weight="medium">
                            {UNITS.find((unit) => unit.value === values.unit)?.label({ count: 1 })}
                          </Typography>
                        </View>
                      </PressableWithHaptics>
                    </View>
                  </View>
                )}

                <CheckRow
                  checked={field.state.value === 'timed'}
                  label="Remind me when it's probably running low"
                  disabled={field.state.value === 'measured' || field.state.value === 'kitchen_basic'}
                  onPress={() => field.handleChange(field.state.value === 'timed' ? 'counted' : 'timed')}
                />
                {field.state.value === 'timed' && (
                  <View style={{ gap: 8 }}>
                    <Typography variant="body-sm" weight="bold">
                      Frequency
                    </Typography>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <form.AppField name="reminder_frequency_value">
                          {(frequencyField) => <frequencyField.NumberField placeholder="1" />}
                        </form.AppField>
                      </View>
                      <form.AppField name="reminder_frequency_unit">
                        {(frequencyUnitField) => (
                          <>
                            {(['days', 'weeks', 'months'] as const).map((unit) => (
                              <Button
                                key={unit}
                                text={unit}
                                size="small"
                                variant={frequencyUnitField.state.value === unit ? 'primary' : 'outlined'}
                                onPress={() => frequencyUnitField.handleChange(unit)}
                              />
                            ))}
                          </>
                        )}
                      </form.AppField>
                    </View>
                  </View>
                )}

                <CheckRow
                  checked={field.state.value === 'kitchen_basic'}
                  label="Kitchen basic"
                  disabled={field.state.value === 'measured' || field.state.value === 'timed'}
                  onPress={() =>
                    field.handleChange(field.state.value === 'kitchen_basic' ? 'counted' : 'kitchen_basic')
                  }
                />
              </View>
            )}
          </form.AppField>
        </View>
      )}
    </form.Subscribe>
  </form.AppForm>
);

const styles = StyleSheet.create({
  checkRow: {
    alignItems: 'center',
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitButton: {
    borderRadius: 8,
    fontSize: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#493D34',
    height: 48,
    justifyContent: 'center',
  },
});
