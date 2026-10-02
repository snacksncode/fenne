import { missingProductConversionsFromError, productImpactFromError } from '@/api/errors';
import { ProductFormField, productValidationErrorsFromError } from '@/api/product-validation-errors';
import { useEditProduct } from '@/api/products';
import { BaseSheet, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { Unit } from '@/lib/quantity';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { ProductBehaviorFields, productBehaviorFieldNames } from '@/components/form/product-behavior-fields';
import {
  productDraftFromForm,
  productDraftSchema,
  productFormFromDraft,
} from '@/components/bottomSheets/editIngredient/ingredient-editor-model';
import { ProductConversionFields } from '@/components/product-conversion-fields';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { convertPackSizeInputs, conversionValuesPayload, unitsRequireProductConversion } from '@/lib/product-conversions';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
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

export const ProductEditSheet = ({ sheetId, data: { product } }: SheetProps<'product-edit-sheet'>) => {
  const sheets = useSheets();
  const insets = useSafeAreaInsets();
  const editProduct = useEditProduct();
  const feedback = useFormFeedback<ProductFormField | `conversion:${Unit}`>(productFormFields);
  const { scrollRef, contentRef, error, setError } = feedback;
  const [impact, setImpact] = useState<string[] | null>(null);
  const [missingConversions, setMissingConversions] = useState<Unit[]>([]);
  const [conversionValues, setConversionValues] = useState<Partial<Record<Unit, string>>>({});
  const focusConversion = (unit: Unit | undefined) => {
    if (unit) feedback.focus(`conversion:${unit}`);
  };

  const form = useAppForm({
    defaultValues: productFormFromDraft(product),
    validators: {
      onSubmit: productDraftSchema,
    },
    listeners: { onChange: ({ formApi }) => { feedback.clearServerErrors(formApi); setImpact(null); } },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value }) => {
      feedback.clearServerErrors(form);
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

      try {
        const updatedProduct = await editProduct.mutateAsync({
          id: product.id,
          ...productDraftFromForm(value),
          ...(requiredConversions.length > 0 && { conversions }),
          impact_acknowledged: impact != null,
        });
        Keyboard.dismiss();
        sheets.dismiss(sheetId, updatedProduct);
      } catch (mutationError) {
        const nextImpact = productImpactFromError(mutationError);
        if (nextImpact) {
          setImpact(nextImpact);
          return;
        }

        const nextMissingConversions = missingProductConversionsFromError(mutationError);
        if (nextMissingConversions) {
          setMissingConversions(nextMissingConversions);
          setConversionValues((current) => Object.fromEntries(
            nextMissingConversions.map((unit) => [unit, current[unit] ?? product.conversions[unit]?.toString() ?? ''])
          ));
          focusConversion(nextMissingConversions[0]);
          return;
        }

        const validationErrors = productValidationErrorsFromError(mutationError);
        if (validationErrors) {
          feedback.applyServerErrors(form, validationErrors);
          return;
        }
        setError('Could not save shopping item');
      }
    },
  });

  return (
    <form.AppForm>
      <BaseSheet
        id={sheetId}
        sizing={{ type: 'scrollable', detents: [1] }}
        containerStyle={{ flex: 1 }}
        footer={
          <form.SubmitButton
            text={impact ? 'Save anyway' : 'Save shopping item'}
            variant={impact ? 'secondary' : 'primary'}
            rightIcon={{ Icon: ArrowRight }}
          />
        }
      >
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={SHEET_FOOTER_HEIGHT + insets.bottom}
          contentContainerStyle={{ paddingBottom: SHEET_FOOTER_HEIGHT + insets.bottom + 24 }}
        >
          <View ref={contentRef} style={{ gap: 16 }}>
            <ShoppingItemIdentity
              name={product.name}
              aisle={product.aisle}
              description="Changes affect recipes, groceries, and pantry behavior."
            />

            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  ref={feedback.inputRef('name')}
                  label="Name"
                />
              )}
            </form.AppField>

            <ProductBehaviorFields
              form={form}
              fields={productBehaviorFieldNames}
              registerControl={(field, node) => feedback.controlRef(field)(node)}
              onSelectAisle={async () => {
                Keyboard.dismiss();
                const aisle = await sheets.present('select-category-sheet');
                if (aisle != null) { feedback.clearServerErrors(form); setImpact(null); form.setFieldValue('aisle', aisle); }
              }}
              onSelectUnit={async () => {
                Keyboard.dismiss();
                const previousUnit = form.state.values.unit;
                const unit = await sheets.present('select-unit-sheet', { data: { unit: previousUnit } });
                if (unit != null && unit !== previousUnit) {
                  feedback.clearServerErrors(form);
                  setImpact(null);
                  form.setFieldValue('pack_sizes', convertPackSizeInputs(form.state.values.pack_sizes, previousUnit, unit));
                  form.setFieldValue('unit', unit);
                  setConversionValues({});
                  setError(null);
                }
              }}
            />
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
                        feedback.inputRef(`conversion:${unit}`)(input);
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
              <form.Error message={error} />
            ) : null}
          </View>
        </KeyboardAwareScrollView>
      </BaseSheet>
    </form.AppForm>
  );
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
