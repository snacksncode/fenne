import { UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { parseLocaleFloat } from '@/utils';
import { X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { productSummary, SelectedProduct } from './ingredient-editor-model';
import { IngredientEditor } from './use-ingredient-editor';

type IngredientDetailsStepProps = {
  form: IngredientEditor['ingredientForm'];
  selectedProduct: SelectedProduct;
  onClearProduct: () => void;
  onEditDraftProduct: () => void;
  onSelectUnit: () => void;
};

export const IngredientDetailsStep = ({
  form,
  selectedProduct,
  onClearProduct,
  onEditDraftProduct,
  onSelectUnit,
}: IngredientDetailsStepProps) => (
  <form.AppForm>
    <form.Subscribe selector={(state) => state.values}>
      {(ingredient) => (
        <View style={{ gap: 16 }}>
          <View style={styles.productPin}>
            <View style={{ flex: 1 }}>
              <Typography variant="body-xs" weight="bold" color={colors.brown[700]}>
                Item
              </Typography>
              <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
                {selectedProduct.product.name}
              </Typography>
              <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
                {productSummary(selectedProduct)}
              </Typography>
            </View>
            {selectedProduct.type === 'draft' && (
              <Button text="Edit" variant="outlined" size="small" onPress={onEditDraftProduct} />
            )}
            <Button
              size="small"
              variant="outlined"
              leftIcon={{ Icon: X }}
              onPress={onClearProduct}
              style={{ paddingHorizontal: 0, width: 42 }}
            />
          </View>

          <form.AppField name="name_override">
            {(field) => <field.TextField label="Display name" placeholder={selectedProduct.product.name} />}
          </form.AppField>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <form.AppField name="quantity">
                {(field) => <field.NumberField label="Quantity" placeholder="e.g. 2" />}
              </form.AppField>
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                Unit
              </Typography>
              <PressableWithHaptics onPress={onSelectUnit}>
                <View style={styles.unitButton}>
                  <Typography variant="body-sm" weight="medium">
                    {UNITS.find((unit) => unit.value === ingredient.unit)?.label({
                      count: parseLocaleFloat(ingredient.quantity),
                    })}
                  </Typography>
                </View>
              </PressableWithHaptics>
            </View>
          </View>
        </View>
      )}
    </form.Subscribe>
  </form.AppForm>
);

const styles = StyleSheet.create({
  productPin: {
    alignItems: 'center',
    backgroundColor: '#FEF2DD',
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
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
