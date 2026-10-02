import { emptyProductForm } from '@/components/bottomSheets/editIngredient/ingredient-editor-model';
import { withFieldGroup } from '@/components/form/app-form';
import { View } from 'react-native';

export type ShoppingItemBehaviorField =
  | 'pack_sizes'
  | 'aisle'
  | 'unit'
  | 'reminder_frequency_value'
  | 'reminder_frequency_unit';

export const productBehaviorFieldNames = {
  mode: 'mode',
  aisle: 'aisle',
  unit: 'unit',
  pack_sizes: 'pack_sizes',
  reminder_frequency_value: 'reminder_frequency_value',
  reminder_frequency_unit: 'reminder_frequency_unit',
} as const;

type Props = {
  onSelectAisle: () => void;
  onSelectUnit: () => void;
  registerControl?: (field: ShoppingItemBehaviorField, node: View | null) => void;
};

/** The Product edit and Ingredient draft share the same visible Product controls. */
export const ProductBehaviorFields = withFieldGroup({
  defaultValues: {
    mode: emptyProductForm.mode,
    aisle: emptyProductForm.aisle,
    unit: emptyProductForm.unit,
    pack_sizes: emptyProductForm.pack_sizes,
    reminder_frequency_value: emptyProductForm.reminder_frequency_value,
    reminder_frequency_unit: emptyProductForm.reminder_frequency_unit,
  },
  props: {} as Props,
  render: ({ group, onSelectAisle, onSelectUnit, registerControl }) => (
    <View style={{ gap: 16 }}>
      <group.AppField name="mode">
        {(field) => <field.ProductBehaviorField />}
      </group.AppField>
      <group.Subscribe selector={(state) => ({ mode: state.values.mode, unit: state.values.unit })}>
        {({ mode, unit }) => (
          <>
            {mode !== 'kitchen_basic' && (
              <group.AppField name="aisle">
                {(field) => <field.AisleField onPress={onSelectAisle} ref={(node) => registerControl?.('aisle', node)} />}
              </group.AppField>
            )}
            {mode === 'tracked' && (
              <group.AppField name="unit">
                {(field) => <field.TrackingUnitField onPress={onSelectUnit} ref={(node) => registerControl?.('unit', node)} />}
              </group.AppField>
            )}
            {mode === 'timed' && (
              <group.AppField name="reminder_frequency_unit">
                {(unitField) => (
                  <View ref={(node) => registerControl?.('reminder_frequency_unit', node)}>
                    <group.AppField name="reminder_frequency_value">
                      {(field) => (
                        <field.ReminderFrequencyField
                          ref={(node) => registerControl?.('reminder_frequency_value', node)}
                          unit={unitField.state.value}
                          onUnitChange={(value) => { unitField.handleChange(value); unitField.handleBlur(); }}
                        />
                      )}
                    </group.AppField>
                    <unitField.Error />
                  </View>
                )}
              </group.AppField>
            )}
            {mode === 'tracked' && unit !== 'count' && (
              <group.AppField name="pack_sizes">
                {(field) => <field.PackSizesField unit={unit} ref={(node) => registerControl?.('pack_sizes', node)} />}
              </group.AppField>
            )}
          </>
        )}
      </group.Subscribe>
    </View>
  ),
});
