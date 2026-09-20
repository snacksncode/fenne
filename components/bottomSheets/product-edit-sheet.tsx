import { PackSizeFields } from '@/components/pack-size-fields';
import { missingProductConversionsFromError, productImpactFromError } from '@/api/errors';
import { ProductFormField, productValidationErrorsFromError } from '@/api/product-validation-errors';
import { useEditProduct } from '@/api/products';
import { ProductDTO } from '@/api/types';
import { BaseSheet, sheetFooter, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { formErrorMessage, useAppForm } from '@/components/form/app-form';
import { TextInputRef } from '@/components/input';
import {
  productDraftFromForm,
  productDraftSchema,
  productFormFromDraft,
} from '@/components/bottomSheets/editIngredient/ingredient-editor-model';
import { ProductConversionFields } from '@/components/product-conversion-fields';
import {
  ShoppingItemBehaviorField,
  ShoppingItemBehaviorFields,
} from '@/components/shopping-item-behavior-fields';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { convertPackSizeInputs, conversionValuesPayload, unitsRequireProductConversion } from '@/lib/product-conversions';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Keyboard, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const productFormFields: ProductFormField[] = [
  'name',
  'pack_sizes',
  'aisle',
  'unit',
  'reminder_frequency_value',
  'reminder_frequency_unit',
];

const impactLabels: Record<string, string> = {
  pantry: 'current pantry entries',
  shopping_list: 'active grocery rows',
};

type ProductEditSheetContentProps = {
  sheetId: SheetProps<'product-edit-sheet'>['sheetId'];
  product: ProductDTO;
};

const ProductEditSheetContent = ({ sheetId, product }: ProductEditSheetContentProps) => {
  const sheets = useSheets();
  const insets = useSafeAreaInsets();
  const editProduct = useEditProduct();
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const contentRef = useRef<View>(null);
  const conversionInputRefs = useRef<Partial<Record<Unit, TextInputRef | null>>>({});
  const fieldRefs = useRef<Partial<Record<ProductFormField, TextInputRef | null>>>({});
  const controlRefs = useRef<Partial<Record<ShoppingItemBehaviorField, View | null>>>({});
  const [impact, setImpact] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingConversions, setMissingConversions] = useState<Unit[]>([]);
  const [conversionValues, setConversionValues] = useState<Partial<Record<Unit, string>>>({});
  const focusField = (field: ProductFormField | undefined) => {
    if (!field) return;
    const input = fieldRefs.current[field];
    if (input) {
      requestAnimationFrame(() => {
        input.focus();
        requestAnimationFrame(() => scrollRef.current?.assureFocusedInputVisible());
      });
      return;
    }

    const controlField = field as ShoppingItemBehaviorField;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const node = controlRefs.current[controlField];
        const content = contentRef.current;
        if (node && content) {
          node.measureLayout(content, (_x, y) => {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
          });
        }
        const handle = node ? findNodeHandle(node) : null;
        if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
      });
    });
  };

  const focusConversion = (unit: Unit | undefined) => {
    if (!unit) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        conversionInputRefs.current[unit]?.focus();
        scrollRef.current?.assureFocusedInputVisible();
      });
    });
  };

  const form = useAppForm({
    defaultValues: productFormFromDraft(product),
    validators: {
      onSubmit: productDraftSchema,
    },
    onSubmitInvalid: ({ formApi }) => {
      const firstInvalidField = productFormFields.find(
        (field) => (formApi.getFieldMeta(field)?.errors.length ?? 0) > 0
      );
      focusField(firstInvalidField);
    },
    onSubmit: ({ value }) => {
      setError(null);
      productFormFields.forEach((field) => {
        if (!form.getFieldMeta(field)) return;

        form.setFieldMeta(field, (meta) => ({
          ...meta,
          errorMap: { ...meta.errorMap, onServer: undefined },
        }));
      });
      const requiredConversions =
        value.mode === 'tracked'
          ? missingConversions.filter((unit) => unitsRequireProductConversion(unit, value.unit))
          : [];
      const conversions = conversionValuesPayload(conversionValues);
      const firstMissingConversion = requiredConversions.find((unit) => conversions[unit] == null);
      if (firstMissingConversion) {
        setError('Enter every conversion before saving');
        focusConversion(firstMissingConversion);
        return;
      }

      editProduct.mutate(
        {
          id: product.id,
          ...productDraftFromForm(value),
          ...(requiredConversions.length > 0 && { conversions }),
          impact_acknowledged: impact != null,
        },
        {
          onSuccess: (updatedProduct) => {
            Keyboard.dismiss();
            sheets.dismiss(sheetId, updatedProduct);
          },
          onError: (mutationError) => {
            const nextImpact = productImpactFromError(mutationError);
            if (nextImpact) {
              setImpact(nextImpact);
              setError(null);
              return;
            }

            const nextMissingConversions = missingProductConversionsFromError(mutationError);
            if (nextMissingConversions) {
              setMissingConversions(nextMissingConversions);
              setConversionValues((current) =>
                Object.fromEntries(
                  nextMissingConversions.map((unit) => [
                    unit,
                    current[unit] ?? product.conversions[unit]?.toString() ?? '',
                  ])
                )
              );
              setError(null);
              focusConversion(nextMissingConversions[0]);
              return;
            }

            const validationErrors = productValidationErrorsFromError(mutationError);
            if (validationErrors) {
              Object.entries(validationErrors.fields).forEach(([field, message]) => {
                form.setFieldMeta(field as ProductFormField, (meta) => ({
                  ...meta,
                  isTouched: true,
                  errorMap: { ...meta.errorMap, onServer: message },
                }));
              });
              setError(validationErrors.form ?? null);
              focusField(productFormFields.find((field) => validationErrors.fields[field] != null));
              return;
            }

            setError('Could not save shopping item');
          },
        }
      );
    },
  });

  return (
    <BaseSheet
      id={sheetId}
      sizing={{ type: 'scrollable', detents: [1] }}
      containerStyle={{ flex: 1 }}
      footer={sheetFooter.buttonRow(
        <Button
          text={impact ? 'Save anyway' : 'Save shopping item'}
          variant={impact ? 'secondary' : 'primary'}
          rightIcon={{ Icon: ArrowRight }}
          onPress={() => form.handleSubmit()}
          isLoading={editProduct.isPending}
        />
      )}
    >
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={SHEET_FOOTER_HEIGHT + insets.bottom}
        contentContainerStyle={{ paddingBottom: SHEET_FOOTER_HEIGHT + insets.bottom + 24 }}
      >
        <form.AppForm>
          <View ref={contentRef} style={{ gap: 16 }}>
            <ShoppingItemIdentity
              name={product.name}
              aisle={product.aisle}
              description="Changes affect recipes, groceries, and pantry behavior."
            />

            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  ref={(input) => {
                    fieldRefs.current.name = input;
                  }}
                  label="Name"
                />
              )}
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
                                  onAislePress={async () => {
                                    Keyboard.dismiss();
                                    const aisle = await sheets.present('select-category-sheet');
                                    if (aisle != null) aisleField.handleChange(aisle);
                                  }}
                                  onUnitPress={async () => {
                                    Keyboard.dismiss();
                                    const unit = await sheets.present('select-unit-sheet', {
                                      data: { unit: unitField.state.value },
                                    });
                                    if (unit != null && unit !== unitField.state.value) {
                                      form.setFieldValue('pack_sizes', convertPackSizeInputs(form.state.values.pack_sizes, unitField.state.value, unit));
                                      unitField.handleChange(unit);
                                      setConversionValues({});
                                      setError(null);
                                    }
                                  }}
                                  onReminderValueChange={frequencyField.handleChange}
                                  onReminderUnitChange={frequencyUnitField.handleChange}
                                  errors={{
                                    aisle:
                                      aisleField.state.meta.errors.map(formErrorMessage).find(Boolean) ?? null,
                                    unit: unitField.state.meta.errors.map(formErrorMessage).find(Boolean) ?? null,
                                    reminder_frequency_value:
                                      frequencyField.state.meta.errors.map(formErrorMessage).find(Boolean) ?? null,
                                    reminder_frequency_unit:
                                      frequencyUnitField.state.meta.errors.map(formErrorMessage).find(Boolean) ?? null,
                                  }}
                                  registerControl={(field, node) => {
                                    controlRefs.current[field] = node;
                                  }}
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

            <form.Subscribe selector={(state) => ({ mode: state.values.mode, unit: state.values.unit })}>
              {({ mode, unit }) => mode === 'tracked' && unit !== 'count' ? (
                <form.AppField name="pack_sizes">
                  {(field) => (
                    <View ref={(node) => { controlRefs.current.pack_sizes = node; }} accessible accessibilityLabel="Pack sizes">
                      <PackSizeFields unit={unit} values={field.state.value} onChange={field.handleChange} />
                      {field.state.meta.errors.map(formErrorMessage).filter(Boolean).map((message, index) => (
                        <Typography key={index} variant="body-xs" weight="medium" color={colors.red[600]}>{message}</Typography>
                      ))}
                    </View>
                  )}
                </form.AppField>
              ) : null}
            </form.Subscribe>
            {missingConversions.length > 0 ? (
              <form.Subscribe selector={(state) => state.values}>
                {(values) => {
                  const requiredConversions =
                    values.mode === 'tracked'
                      ? missingConversions.filter((unit) => unitsRequireProductConversion(unit, values.unit))
                      : [];

                  return requiredConversions.length > 0 ? (
                    <ProductConversionFields
                      productName={values.name.trim() || product.name}
                      productUnit={values.unit}
                      units={requiredConversions}
                      values={conversionValues}
                      onChange={(unit, value) => {
                        setConversionValues((current) => ({ ...current, [unit]: value }));
                        setError(null);
                      }}
                      error={error}
                      registerInput={(unit, input) => {
                        conversionInputRefs.current[unit] = input;
                      }}
                    />
                  ) : null;
                }}
              </form.Subscribe>
            ) : null}

            {impact ? (
              <View style={styles.warning}>
                <Typography variant="body-sm" weight="bold">
                  This change will clear {impact.map((item) => impactLabels[item] ?? item).join(' and ')}.
                </Typography>
                <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
                  Tap Save anyway to confirm.
                </Typography>
              </View>
            ) : null}

            {error &&
            (form.state.values.mode !== 'tracked' ||
              !missingConversions.some((unit) => unitsRequireProductConversion(unit, form.state.values.unit))) ? (
              <Typography variant="body-sm" weight="bold" color={colors.red[500]}>
                {error}
              </Typography>
            ) : null}
          </View>
        </form.AppForm>
      </KeyboardAwareScrollView>
    </BaseSheet>
  );
};

export const ProductEditSheet = (props: SheetProps<'product-edit-sheet'>) => {
  return <ProductEditSheetContent sheetId={props.sheetId} product={props.data.product} />;
};

const styles = StyleSheet.create({
  warning: {
    gap: 4,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 8,
    borderColor: colors.orange[600],
    backgroundColor: colors.orange[100],
    padding: 12,
  },
});
