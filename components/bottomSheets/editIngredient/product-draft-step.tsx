import { AisleHeader } from '@/components/aisle-header';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import {
  ProductBehaviorSelector,
  TrackingUnitSelect,
} from '@/components/product-behavior-selector';
import { ReminderFrequencyFields } from '@/components/reminder-frequency-fields';
import { Typography } from '@/components/Typography';
import { StyleSheet, View } from 'react-native';
import { IngredientEditor } from './use-ingredient-editor';

type ProductDraftStepProps = {
  form: IngredientEditor['productForm'];
  onSelectAisle: () => void;
  onSelectUnit: () => void;
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
                  <Typography variant="body-sm" weight="bold" style={styles.label}>
                    Category
                  </Typography>
                  <PressableWithHaptics onPress={onSelectAisle}>
                    <AisleHeader type={field.state.value} />
                  </PressableWithHaptics>
                </View>
              )}
            </form.AppField>
          )}

          <form.AppField name="mode">
            {(field) => <ProductBehaviorSelector value={field.state.value} onChange={field.handleChange} />}
          </form.AppField>

          {values.mode === 'tracked' && (
            <form.AppField name="unit">
              {(field) => <TrackingUnitSelect unit={field.state.value} onPress={onSelectUnit} />}
            </form.AppField>
          )}

          {values.mode === 'timed' && (
            <form.AppField name="reminder_frequency_value">
              {(frequencyField) => (
                <form.AppField name="reminder_frequency_unit">
                  {(unitField) => (
                    <ReminderFrequencyFields
                      input={
                        <View style={{ flex: 1 }}>
                          <frequencyField.NumberField placeholder="1" />
                        </View>
                      }
                      unit={unitField.state.value}
                      onUnitChange={unitField.handleChange}
                    />
                  )}
                </form.AppField>
              )}
            </form.AppField>
          )}
        </View>
      )}
    </form.Subscribe>
  </form.AppForm>
);

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
});
