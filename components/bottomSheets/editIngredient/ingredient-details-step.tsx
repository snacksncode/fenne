import { Button } from '@/components/button';
import { ProductConversionFields } from '@/components/product-conversion-fields';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { productConversionRequirement } from '@/lib/product-conversions';
import { parseLocaleFloat } from '@/lib/quantity';
import { X } from 'lucide-react-native';
import { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInputRef } from '@/components/input';
import { IngredientEditor } from './use-ingredient-editor';

type IngredientDetailsStepProps = Omit<Extract<IngredientEditor['step'], { phase: 'ingredient' }>, 'phase'> & {
  displayNameInputRef?: Ref<TextInputRef>;
  quantityInputRef?: Ref<TextInputRef>;
  unitControlRef?: Ref<View>;
  conversionInputRef?: Ref<TextInputRef>;
};

export const IngredientDetailsStep = ({
  form,
  selectedProduct,
  onClearProduct,
  onEditProduct,
  onSelectUnit,
  conversionValues,
  conversionError,
  onConversionChange,
  displayNameInputRef,
  quantityInputRef,
  unitControlRef,
  conversionInputRef,
}: IngredientDetailsStepProps) => (
  <form.AppForm>
    <form.Subscribe selector={(state) => state.values}>
      {(ingredient) => {
        const conversion = productConversionRequirement(selectedProduct.product, ingredient.unit);

        return (
          <View style={{ gap: 16 }}>
            <View style={styles.productPin}>
              <ShoppingItemIdentity
                name={selectedProduct.product.name}
                aisle={selectedProduct.product.aisle}
                compact
                style={{ flex: 1 }}
              />
              <Button
                text="Edit"
                variant="outlined"
                size="small"
                onPress={onEditProduct}
              />
              <Button
                accessibilityLabel="Clear selected shopping item"
                size="small"
                variant="outlined"
                leftIcon={{ Icon: X }}
                onPress={onClearProduct}
                style={{ paddingHorizontal: 0, width: 42 }}
              />
            </View>

            <form.AppField name="name_override">
              {(field) => (
                <field.TextField
                  ref={displayNameInputRef}
                  label="Display name"
                  placeholder={selectedProduct.product.name}
                />
              )}
            </form.AppField>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <form.AppField name="quantity">
                  {(field) => (
                    <field.NumberField ref={quantityInputRef} label="Quantity" placeholder="e.g. 2" />
                  )}
                </form.AppField>
              </View>
              <View style={{ flex: 1 }}>
                <form.AppField name="unit">{(field) => (
                  <field.UnitField quantity={parseLocaleFloat(ingredient.quantity)} onPress={onSelectUnit} ref={unitControlRef} />
                )}</form.AppField>
              </View>
            </View>

            {conversion ? (
              <ProductConversionFields
                productName={selectedProduct.product.name}
                productUnit={conversion.productUnit}
                units={[conversion.ingredientUnit]}
                values={conversionValues}
                onChange={onConversionChange}
                error={conversionError}
                registerInput={(_unit, input) => {
                  if (typeof conversionInputRef === 'function') conversionInputRef(input);
                  else if (conversionInputRef) conversionInputRef.current = input;
                }}
              />
            ) : null}
          </View>
        );
      }}
    </form.Subscribe>
  </form.AppForm>
);

const styles = StyleSheet.create({
  productPin: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
