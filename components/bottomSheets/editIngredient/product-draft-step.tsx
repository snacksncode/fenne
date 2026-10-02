import { TextInputRef } from '@/components/input';
import { ProductBehaviorFields, productBehaviorFieldNames } from '@/components/form/product-behavior-fields';
import { ShoppingItemBehaviorField } from '@/components/shopping-item-behavior-fields';
import { View } from 'react-native';
import { Ref } from 'react';
import { IngredientEditor } from './use-ingredient-editor';

type ProductDraftStepProps = {
  form: Extract<IngredientEditor['step'], { phase: 'product' }>['form'];
  onSelectAisle: () => void;
  onSelectUnit: () => void;
  nameInputRef?: Ref<TextInputRef>;
  registerControl?: (field: ShoppingItemBehaviorField, node: View | null) => void;
};

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
      <ProductBehaviorFields
        form={form}
        fields={productBehaviorFieldNames}
        onSelectAisle={onSelectAisle}
        onSelectUnit={onSelectUnit}
        registerControl={registerControl}
      />
    </View>
  </form.AppForm>
);
