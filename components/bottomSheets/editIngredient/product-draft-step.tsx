import { TextInputRef } from '@/components/input';
import { formErrorMessage } from '@/components/form/app-form';
import {
  ShoppingItemBehaviorField,
  ShoppingItemBehaviorFields,
} from '@/components/shopping-item-behavior-fields';
import { View } from 'react-native';
import { Ref } from 'react';
import { IngredientEditor } from './use-ingredient-editor';

type ProductDraftStepProps = {
  form: IngredientEditor['productForm'];
  onSelectAisle: () => void;
  onSelectUnit: () => void;
  nameInputRef?: Ref<TextInputRef>;
  registerControl?: (field: ShoppingItemBehaviorField, node: View | null) => void;
};

const firstError = (errors: unknown[]) => errors.map(formErrorMessage).find((message) => message != null) ?? null;

export const ProductDraftStep = ({
  form,
  onSelectAisle,
  onSelectUnit,
  nameInputRef,
  registerControl,
}: ProductDraftStepProps) => (
  <form.AppForm>
    <View style={{ gap: 16 }}>
      <form.AppField name="name">
        {(field) => <field.TextField ref={nameInputRef} label="Name" />}
      </form.AppField>
      <form.AppField name="mode">
        {(modeField) => (
          <form.AppField name="aisle">
            {(aisleField) => (
              <form.AppField name="unit">
                {(unitField) => (
                  <form.AppField name="reminder_frequency_value">
                    {(frequencyField) => (
                      <form.AppField name="reminder_frequency_unit">
                        {(frequencyUnitField) => (
                          <ShoppingItemBehaviorFields
                            mode={modeField.state.value}
                            aisle={aisleField.state.value}
                            unit={unitField.state.value}
                            reminderValue={frequencyField.state.value}
                            reminderUnit={frequencyUnitField.state.value}
                            onModeChange={modeField.handleChange}
                            onAislePress={onSelectAisle}
                            onUnitPress={onSelectUnit}
                            onReminderValueChange={frequencyField.handleChange}
                            onReminderUnitChange={frequencyUnitField.handleChange}
                            errors={{
                              aisle: firstError(aisleField.state.meta.errors),
                              unit: firstError(unitField.state.meta.errors),
                              reminder_frequency_value: firstError(frequencyField.state.meta.errors),
                              reminder_frequency_unit: firstError(frequencyUnitField.state.meta.errors),
                            }}
                            registerControl={registerControl}
                          />
                        )}
                      </form.AppField>
                    )}
                  </form.AppField>
                )}
              </form.AppField>
            )}
          </form.AppField>
        )}
      </form.AppField>
    </View>
  </form.AppForm>
);
