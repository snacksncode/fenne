import { missingProductConversionsFromError, productImpactFromError } from '@/api/errors';
import { ProductFormField, productValidationErrorsFromError } from '@/api/product-validation-errors';
import { useEditProduct } from '@/api/products';
import { ProductDTO } from '@/api/types';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet, sheetFooter, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { TextInputRef } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import {
  productDraftFromForm,
  productDraftSchema,
  productFormFromDraft,
} from '@/components/bottomSheets/editIngredient/ingredient-editor-model';
import {
  ProductBehaviorSelector,
  TrackingUnitSelect,
} from '@/components/product-behavior-selector';
import { ReminderFrequencyFields } from '@/components/reminder-frequency-fields';
import { ProductConversionFields } from '@/components/product-conversion-fields';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { conversionValuesPayload, unitsRequireProductConversion } from '@/lib/product-conversions';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const productFormFields: ProductFormField[] = [
  'name',
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
  const fieldRefs = useRef<Partial<Record<ProductFormField, TextInputRef | null>>>({});
  const [impact, setImpact] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingConversions, setMissingConversions] = useState<Unit[]>([]);
  const [conversionValues, setConversionValues] = useState<Partial<Record<Unit, string>>>({});
  const focusField = (field: ProductFormField | undefined) => {
    if (!field) return;
    const input = fieldRefs.current[field];
    if (!input) return;

    requestAnimationFrame(() => {
      input.focus();
      requestAnimationFrame(() => scrollRef.current?.assureFocusedInputVisible());
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
      if (requiredConversions.some((unit) => conversions[unit] == null)) {
        setError('Enter every conversion before saving');
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
              requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
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
        contentContainerStyle={{ paddingBottom: SHEET_FOOTER_HEIGHT + insets.bottom + 24 }}
      >
        <form.AppForm>
          <View style={{ gap: 16 }}>
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

            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <>
                  <form.AppField name="mode">
                    {(field) => <ProductBehaviorSelector value={field.state.value} onChange={field.handleChange} />}
                  </form.AppField>

                  {values.mode !== 'kitchen_basic' && (
                    <form.AppField name="aisle">
                      {(field) => (
                        <View>
                          <Typography variant="body-sm" weight="bold" style={styles.label}>
                            Category
                          </Typography>
                          <PressableWithHaptics
                            onPress={async () => {
                              Keyboard.dismiss();
                              const aisle = await sheets.present('select-category-sheet');
                              if (aisle != null) field.handleChange(aisle);
                            }}
                          >
                            <AisleHeader type={field.state.value} showEditIndicator />
                          </PressableWithHaptics>
                        </View>
                      )}
                    </form.AppField>
                  )}

                  {values.mode === 'tracked' && (
                    <form.AppField name="unit">
                      {(field) => (
                        <TrackingUnitSelect
                          unit={field.state.value}
                          onPress={async () => {
                              Keyboard.dismiss();
                              const unit = await sheets.present('select-unit-sheet', {
                                data: { unit: field.state.value },
                              });
                              if (unit != null && unit !== field.state.value) {
                                field.handleChange(unit);
                                setConversionValues({});
                                setError(null);
                              }
                          }}
                        />
                      )}
                    </form.AppField>
                  )}

                  {values.mode === 'timed' && (
                    <form.AppField name="reminder_frequency_value">
                      {(frequencyField) => (
                        <form.AppField name="reminder_frequency_unit">
                          {(unitField) => (
                            <ReminderFrequencyFields
                              value={frequencyField.state.value}
                              unit={unitField.state.value}
                              onValueChange={frequencyField.handleChange}
                              onUnitChange={unitField.handleChange}
                            />
                          )}
                        </form.AppField>
                      )}
                    </form.AppField>
                  )}
                </>
              )}
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
  label: {
    marginBottom: 4,
  },
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
