import {
  AisleCategory,
  IngredientFormData,
  IngredientProductSelection,
  ProductDTO,
  ProductDraft,
  ProductSuggestionDTO,
} from '@/api/types';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Unit, UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { useAppForm } from '@/components/form/app-form';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { parseLocaleFloat } from '@/utils';
import { ArrowLeft, ArrowRight, X } from 'lucide-react-native';
import { nanoid } from 'nanoid/non-secure';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { z } from 'zod';

type SelectedProduct = IngredientProductSelection;
type IngredientDetailsFormData = Omit<IngredientFormData, 'selectedProduct'>;

type Phase = 'search' | 'product' | 'ingredient';
type ProductMode = 'counted' | 'measured' | 'timed' | 'kitchen_basic';

type ProductDraftForm = {
  name: string;
  aisle: AisleCategory;
  pack_count: string;
  mode: ProductMode;
  quantity: string;
  unit: Unit;
  reminder_frequency_value: string;
  reminder_frequency_unit: 'days' | 'weeks' | 'months';
};

const productName = (selected: SelectedProduct) => selected.product.name;
const productAisle = (selected: SelectedProduct) => selected.product.aisle;
const productUnit = (selected: SelectedProduct) => selected.product.unit;

const productSummary = (selected: SelectedProduct) => {
  const product = selected.product;
  if (product.is_kitchen_basic) return 'Kitchen basic';
  if (product.reminder_frequency_value && product.reminder_frequency_unit) {
    return `Remind every ${product.reminder_frequency_value} ${product.reminder_frequency_unit}`;
  }
  if (product.quantity && product.unit !== 'count') return `${product.quantity} ${product.unit}`;
  if (product.pack_count) return `Pack of ${product.pack_count}`;
  return 'Counted item';
};

const ingredientFromProduct = (selected: SelectedProduct, previous?: IngredientDetailsFormData): IngredientDetailsFormData => ({
  id: previous?.id ?? nanoid(),
  name: previous?.name_override?.trim() || productName(selected),
  name_override: previous?.name_override ?? null,
  quantity: previous?.quantity ?? selected.product.quantity?.toString() ?? '1',
  unit: previous?.unit ?? productUnit(selected),
  aisle: productAisle(selected),
});

const productFormFromSuggestion = (suggestion: ProductSuggestionDTO): ProductDraftForm => ({
  name: suggestion.name,
  aisle: suggestion.aisle,
  pack_count: '',
  mode: 'counted',
  quantity: '',
  unit: 'g',
  reminder_frequency_value: '1',
  reminder_frequency_unit: 'months',
});

const productFormFromQuery = (query: string): ProductDraftForm => ({
  name: query.trim(),
  aisle: 'other',
  pack_count: '',
  mode: 'counted',
  quantity: '',
  unit: 'g',
  reminder_frequency_value: '1',
  reminder_frequency_unit: 'months',
});

const productFormFromDraft = (draft: ProductDraft): ProductDraftForm => {
  const mode: ProductMode = draft.is_kitchen_basic
    ? 'kitchen_basic'
    : draft.reminder_frequency_value && draft.reminder_frequency_unit
      ? 'timed'
      : draft.quantity && draft.unit !== 'count'
        ? 'measured'
        : 'counted';

  return {
    name: draft.name,
    aisle: draft.aisle,
    pack_count: draft.pack_count?.toString() ?? '',
    mode,
    quantity: draft.quantity?.toString() ?? '',
    unit: draft.unit === 'count' ? 'g' : draft.unit,
    reminder_frequency_value: draft.reminder_frequency_value?.toString() ?? '1',
    reminder_frequency_unit: draft.reminder_frequency_unit ?? 'months',
  };
};

const productDraftFromForm = (form: ProductDraftForm): ProductDraft => {
  const isKitchenBasic = form.mode === 'kitchen_basic';
  const isMeasured = form.mode === 'measured';
  const isTimed = form.mode === 'timed';

  return {
    name: form.name.trim(),
    aisle: isKitchenBasic ? 'other' : form.aisle,
    unit: isMeasured ? form.unit : 'count',
    quantity: isMeasured ? parseLocaleFloat(form.quantity) : null,
    pack_count: isKitchenBasic || form.pack_count.trim() === '' ? null : parseInt(form.pack_count, 10),
    reminder_frequency_value: isTimed ? parseInt(form.reminder_frequency_value, 10) : null,
    reminder_frequency_unit: isTimed ? form.reminder_frequency_unit : null,
    is_kitchen_basic: isKitchenBasic,
    conversions: {},
  };
};

const emptyProductForm = productFormFromQuery('');

const emptyIngredientForm = (): IngredientDetailsFormData => ({
  id: nanoid(),
  name: '',
  name_override: null,
  quantity: '1',
  unit: 'count',
  aisle: 'other',
});

const productDraftSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    aisle: z.custom<AisleCategory>(),
    pack_count: z.string(),
    mode: z.enum(['counted', 'measured', 'timed', 'kitchen_basic']),
    quantity: z.string(),
    unit: z.custom<Unit>(),
    reminder_frequency_value: z.string(),
    reminder_frequency_unit: z.enum(['days', 'weeks', 'months']),
  })
  .superRefine((value, context) => {
    if (value.mode === 'measured') {
      const quantity = parseLocaleFloat(value.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        context.addIssue({ code: 'custom', path: ['quantity'], message: 'Amount must be greater than 0' });
      }
    }

    if (value.mode === 'timed') {
      const frequency = parseInt(value.reminder_frequency_value, 10);
      if (!Number.isFinite(frequency) || frequency <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['reminder_frequency_value'],
          message: 'Reminder frequency must be greater than 0',
        });
      }
    }
  });

const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_override: z.string().nullable(),
  unit: z.custom<Unit>(),
  aisle: z.custom<AisleCategory>(),
  quantity: z.string().refine((value) => {
    const quantity = parseLocaleFloat(value);
    return Number.isFinite(quantity) && quantity > 0;
  }, 'Quantity must be greater than 0'),
});

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

type EditIngredientSheetData = SheetProps<'edit-ingredient-sheet'>['data'];

const EditIngredientSheetContent = ({
  sheetId,
  data,
}: {
  sheetId: SheetProps<'edit-ingredient-sheet'>['sheetId'];
  data: EditIngredientSheetData;
}) => {
  const sheets = useSheets();
  const initialIngredient = data.ingredient;
  const initialSelected = initialIngredient?.selectedProduct ?? null;

  const [phase, setPhase] = useState<Phase>(initialSelected ? 'ingredient' : 'search');
  const [query, setQuery] = useState(initialIngredient?.name ?? '');
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(initialSelected);
  const productForm = useAppForm({
    defaultValues:
      initialIngredient?.selectedProduct.type === 'draft'
        ? productFormFromDraft(initialIngredient.selectedProduct.product)
        : emptyProductForm,
    validators: {
      onSubmit: productDraftSchema,
    },
    onSubmit: ({ value }) => {
      const selected: SelectedProduct = { type: 'draft', product: productDraftFromForm(value) };
      setSelectedProduct(selected);
      setIngredientFormValues(ingredientFromProduct(selected, ingredientForm.state.values));
      setPhase('ingredient');
    },
  });
  const ingredientForm = useAppForm({
    defaultValues: initialSelected ? ingredientFromProduct(initialSelected, initialIngredient) : emptyIngredientForm(),
    validators: {
      onSubmit: ingredientSchema,
    },
    onSubmit: ({ value }) => {
      if (!selectedProduct) return;
      const displayName = value.name_override?.trim() || productName(selectedProduct);
      if (!displayName.trim()) return;

      sheets.dismiss(sheetId, {
        ...value,
        selectedProduct,
        name: displayName,
        aisle: productAisle(selectedProduct),
        unit: value.unit,
      });
      Keyboard.dismiss();
    },
  });

  const setProductFormValues = (form: ProductDraftForm) => {
    productForm.setFieldValue('name', form.name);
    productForm.setFieldValue('aisle', form.aisle);
    productForm.setFieldValue('pack_count', form.pack_count);
    productForm.setFieldValue('mode', form.mode);
    productForm.setFieldValue('quantity', form.quantity);
    productForm.setFieldValue('unit', form.unit);
    productForm.setFieldValue('reminder_frequency_value', form.reminder_frequency_value);
    productForm.setFieldValue('reminder_frequency_unit', form.reminder_frequency_unit);
  };

  const setIngredientFormValues = (ingredient: IngredientDetailsFormData) => {
    ingredientForm.setFieldValue('id', ingredient.id);
    ingredientForm.setFieldValue('name', ingredient.name);
    ingredientForm.setFieldValue('name_override', ingredient.name_override);
    ingredientForm.setFieldValue('quantity', ingredient.quantity);
    ingredientForm.setFieldValue('unit', ingredient.unit);
    ingredientForm.setFieldValue('aisle', ingredient.aisle);
  };

  const selectExistingProduct = (product: ProductDTO) => {
    const selected: SelectedProduct = { type: 'existing', product };
    setSelectedProduct(selected);
    setIngredientFormValues(ingredientFromProduct(selected, ingredientForm.state.values));
    setPhase('ingredient');
    Keyboard.dismiss();
  };

  const startDraftProduct = (form: ProductDraftForm) => {
    setProductFormValues(form);
    setPhase('product');
    Keyboard.dismiss();
  };

  const handleSelectSearchOption = (choice: ProductChoice) => {
    if (choice.kind === 'product') {
      selectExistingProduct(choice.product);
    } else if (choice.kind === 'suggestion') {
      startDraftProduct(productFormFromSuggestion(choice.suggestion));
    } else {
      startDraftProduct(productFormFromQuery(choice.name));
    }
  };

  const handleProductNext = () => {
    productForm.handleSubmit();
  };

  const handleSave = () => {
    ingredientForm.handleSubmit();
  };

  const handleBack = () => {
    if (phase === 'search') return;
    setPhase('search');
  };

  const handleEditDraftProduct = () => {
    if (selectedProduct?.type !== 'draft') return;
    setProductFormValues(productFormFromDraft(selectedProduct.product));
    setPhase('product');
  };

  const handleOpenProductUnitSheet = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: productForm.state.values.unit,
      },
    });
    if (unit != null && unit !== 'count') productForm.setFieldValue('unit', unit);
  };

  const handleOpenIngredientUnitSheet = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: ingredientForm.state.values.unit,
      },
    });
    if (unit != null) ingredientForm.setFieldValue('unit', unit);
  };

  const handleOpenAisleSheet = async () => {
    Keyboard.dismiss();
    const aisle = await sheets.present('select-category-sheet');
    if (aisle != null) productForm.setFieldValue('aisle', aisle);
  };

  const action =
    phase === 'product'
      ? { text: 'Next', onPress: handleProductNext }
      : phase === 'ingredient'
        ? { text: 'Save ingredient', onPress: handleSave }
        : null;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      {phase !== 'search' && (
        <Button
          size="small"
          variant="outlined"
          leftIcon={{ Icon: ArrowLeft }}
          onPress={handleBack}
          style={{ paddingHorizontal: 0, width: 42 }}
        />
      )}
      <Typography variant="heading-sm" weight="bold">
        {phase === 'product' ? 'Item Details' : initialIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
      </Typography>
    </View>
  );

  return (
    <BaseSheet
      id={sheetId}
      footer={
        action
          ? sheetFooter.buttonRow(
              <Button text={action.text} variant="primary" rightIcon={{ Icon: ArrowRight }} onPress={action.onPress} />
            )
          : undefined
      }
    >
      {phase === 'search' ? (
        <>
          {header}
          <ProductSearchStep
            context="recipe"
            query={query}
            onQueryChange={setQuery}
            onSelect={handleSelectSearchOption}
            placeholder="Search items..."
            autoFocus
            inputStyle={styles.searchInput}
            listStyle={{ maxHeight: 240 }}
          />
        </>
      ) : (
        <>
          {header}
          {phase === 'product' && (
            <productForm.AppForm>
              <productForm.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <View style={{ gap: 16 }}>
                    <productForm.AppField name="name">
                      {(field) => <field.TextField label="Name" />}
                    </productForm.AppField>

                    {values.mode !== 'kitchen_basic' && (
                      <productForm.AppField name="aisle">
                        {(field) => (
                          <View>
                            <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                              Category
                            </Typography>
                            <PressableWithHaptics onPress={handleOpenAisleSheet}>
                              <AisleHeader type={field.state.value} />
                            </PressableWithHaptics>
                          </View>
                        )}
                      </productForm.AppField>
                    )}

                    {values.mode !== 'kitchen_basic' && (
                      <productForm.AppField name="pack_count">
                        {(field) => <field.NumberField label="Sold in packs of" placeholder="e.g. 12" />}
                      </productForm.AppField>
                    )}

                    <productForm.AppField name="mode">
                      {(field) => (
                        <View style={{ gap: 8 }}>
                          <CheckRow
                            checked={field.state.value === 'measured'}
                            label="Track how much is left"
                            disabled={field.state.value === 'timed' || field.state.value === 'kitchen_basic'}
                            onPress={() =>
                              field.handleChange(field.state.value === 'measured' ? 'counted' : 'measured')
                            }
                          />
                          {field.state.value === 'measured' && (
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              <View style={{ flex: 1 }}>
                                <productForm.AppField name="quantity">
                                  {(quantityField) => (
                                    <quantityField.NumberField label="Amount" placeholder="e.g. 500" />
                                  )}
                                </productForm.AppField>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                                  Unit
                                </Typography>
                                <PressableWithHaptics onPress={handleOpenProductUnitSheet}>
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
                                  <productForm.AppField name="reminder_frequency_value">
                                    {(frequencyField) => <frequencyField.NumberField placeholder="1" />}
                                  </productForm.AppField>
                                </View>
                                <productForm.AppField name="reminder_frequency_unit">
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
                                </productForm.AppField>
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
                    </productForm.AppField>
                  </View>
                )}
              </productForm.Subscribe>
            </productForm.AppForm>
          )}

          {phase === 'ingredient' && selectedProduct && (
            <ingredientForm.AppForm>
              <ingredientForm.Subscribe selector={(state) => state.values}>
                {(ingredient) => (
                  <View style={{ gap: 16 }}>
                    <View style={styles.productPin}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body-xs" weight="bold" color={colors.brown[700]}>
                          Item
                        </Typography>
                        <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
                          {productName(selectedProduct)}
                        </Typography>
                        <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
                          {productSummary(selectedProduct)}
                        </Typography>
                      </View>
                      {selectedProduct.type === 'draft' && (
                        <Button text="Edit" variant="outlined" size="small" onPress={handleEditDraftProduct} />
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        leftIcon={{ Icon: X }}
                        onPress={() => setPhase('search')}
                        style={{ paddingHorizontal: 0, width: 42 }}
                      />
                    </View>

                    <ingredientForm.AppField name="name_override">
                      {(field) => <field.TextField label="Display name" placeholder={productName(selectedProduct)} />}
                    </ingredientForm.AppField>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <ingredientForm.AppField name="quantity">
                          {(field) => <field.NumberField label="Quantity" placeholder="e.g. 2" />}
                        </ingredientForm.AppField>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                          Unit
                        </Typography>
                        <PressableWithHaptics onPress={handleOpenIngredientUnitSheet}>
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
              </ingredientForm.Subscribe>
            </ingredientForm.AppForm>
          )}
          <View style={{ height: 72 }} />
        </>
      )}
    </BaseSheet>
  );
};

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  return <EditIngredientSheetContent sheetId={props.sheetId} data={props.data} />;
};

const styles = StyleSheet.create({
  searchInput: {
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
  },
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
