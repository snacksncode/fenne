import { APIError } from '@/api/client';
import { useEditProduct } from '@/api/products';
import { AisleCategory, ProductDTO, ProductDraft } from '@/api/types';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Unit, UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { useAppForm } from '@/components/form/app-form';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

type ProductMode = 'counted' | 'measured' | 'timed' | 'kitchen_basic';

type ProductForm = {
  name: string;
  aisle: AisleCategory;
  pack_count: string;
  mode: ProductMode;
  quantity: string;
  unit: Unit;
  reminder_frequency_value: string;
  reminder_frequency_unit: 'days' | 'weeks' | 'months';
};

const productMode = (product: ProductDTO): ProductMode => {
  if (product.is_kitchen_basic || product.shape === 'kitchen_basic') return 'kitchen_basic';
  if (product.shape === 'timed') return 'timed';
  if (product.shape === 'measured') return 'measured';
  return 'counted';
};

const formFromProduct = (product: ProductDTO): ProductForm => ({
  name: product.name,
  aisle: product.aisle,
  pack_count: product.pack_count?.toString() ?? '',
  mode: productMode(product),
  quantity: product.quantity?.toString() ?? '',
  unit: product.unit === 'count' ? 'g' : product.unit,
  reminder_frequency_value: product.reminder_frequency_value?.toString() ?? '1',
  reminder_frequency_unit: product.reminder_frequency_unit ?? 'months',
});

const draftFromForm = (form: ProductForm): ProductDraft => {
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

const productEditSchema = z
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
        context.addIssue({
          code: 'custom',
          path: ['quantity'],
          message: 'Amount must be greater than 0',
        });
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

const errorData = (error: Error) => (error instanceof APIError ? error.data : null);

const impactLabels: Record<string, string> = {
  pantry: 'current pantry entries',
  shopping_list: 'active grocery rows',
};

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

type ProductEditSheetContentProps = {
  sheetId: SheetProps<'product-edit-sheet'>['sheetId'];
  product: ProductDTO;
};

const ProductEditSheetContent = ({ sheetId, product }: ProductEditSheetContentProps) => {
  const sheets = useSheets();
  const editProduct = useEditProduct();
  const [impact, setImpact] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: formFromProduct(product),
    validators: {
      onSubmit: productEditSchema,
    },
    onSubmit: ({ value }) => {
      setError(null);

      editProduct.mutate(
        {
          id: product.id,
          ...draftFromForm(value),
          impact_acknowledged: impact != null,
        },
        {
          onSuccess: () => {
            Keyboard.dismiss();
            sheets.dismiss(sheetId);
          },
          onError: (mutationError) => {
            const data = errorData(mutationError);
            if (data && typeof data === 'object' && 'impact' in data && Array.isArray(data.impact)) {
              setImpact(data.impact.filter((item): item is string => typeof item === 'string'));
              setError(null);
              return;
            }

            if (
              data &&
              typeof data === 'object' &&
              'missing_conversions' in data &&
              Array.isArray(data.missing_conversions)
            ) {
              setError(`Missing conversions: ${data.missing_conversions.join(', ')}`);
              return;
            }

            setError('Could not save item');
          },
        }
      );
    },
  });

  return (
    <BaseSheet
      id={sheetId}
      sizing={{ type: 'scrollable', detents: [0.6, 1] }}
      footer={sheetFooter.buttonRow(
        <Button
          text={impact ? 'Save anyway' : 'Save item'}
          variant={impact ? 'secondary' : 'primary'}
          rightIcon={{ Icon: ArrowRight }}
          onPress={() => form.handleSubmit()}
          isLoading={editProduct.isPending}
        />
      )}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <form.AppForm>
          <View style={{ gap: 16, paddingBottom: 72 }}>
            <View>
              <Typography variant="heading-sm" weight="bold">
                Edit item
              </Typography>
              <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
                Changes affect recipes, groceries, and pantry behavior.
              </Typography>
            </View>

            <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>

            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <>
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
                            <AisleHeader type={field.state.value} />
                          </PressableWithHaptics>
                        </View>
                      )}
                    </form.AppField>
                  )}

                  {values.mode !== 'kitchen_basic' && (
                    <form.AppField name="pack_count">
                      {(field) => <field.NumberField label="Sold in packs of" placeholder="e.g. 12" />}
                    </form.AppField>
                  )}

                  <form.AppField name="mode">
                    {(modeField) => (
                      <View style={{ gap: 8 }}>
                        <CheckRow
                          checked={values.mode === 'measured'}
                          label="Track how much is left"
                          disabled={values.mode === 'timed' || values.mode === 'kitchen_basic'}
                          onPress={() =>
                            modeField.handleChange(values.mode === 'measured' ? 'counted' : 'measured')
                          }
                        />
                        {values.mode === 'measured' && (
                          <View style={styles.twoColumn}>
                            <View style={{ flex: 1 }}>
                              <form.AppField name="quantity">
                                {(field) => <field.NumberField label="Amount" placeholder="e.g. 500" />}
                              </form.AppField>
                            </View>
                            <form.AppField name="unit">
                              {(field) => (
                                <View style={{ flex: 1 }}>
                                  <Typography variant="body-sm" weight="bold" style={styles.label}>
                                    Unit
                                  </Typography>
                                  <PressableWithHaptics
                                    onPress={async () => {
                                      Keyboard.dismiss();
                                      const unit = await sheets.present('select-unit-sheet', {
                                        data: { unit: field.state.value },
                                      });
                                      if (unit != null && unit !== 'count') field.handleChange(unit);
                                    }}
                                  >
                                    <View style={styles.unitButton}>
                                      <Typography variant="body-sm" weight="medium">
                                        {UNITS.find((unit) => unit.value === field.state.value)?.label({ count: 1 })}
                                      </Typography>
                                    </View>
                                  </PressableWithHaptics>
                                </View>
                              )}
                            </form.AppField>
                          </View>
                        )}

                        <CheckRow
                          checked={values.mode === 'timed'}
                          label="Remind me when it's probably running low"
                          disabled={values.mode === 'measured' || values.mode === 'kitchen_basic'}
                          onPress={() => modeField.handleChange(values.mode === 'timed' ? 'counted' : 'timed')}
                        />
                        {values.mode === 'timed' && (
                          <View style={{ gap: 8 }}>
                            <Typography variant="body-sm" weight="bold">
                              Frequency
                            </Typography>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <form.AppField name="reminder_frequency_value">
                                {(field) => <field.NumberField placeholder="1" style={{ flex: 1 }} />}
                              </form.AppField>
                              <form.AppField name="reminder_frequency_unit">
                                {(field) => (
                                  <>
                                    {(['days', 'weeks', 'months'] as const).map((unit) => (
                                      <Button
                                        key={unit}
                                        text={unit}
                                        size="small"
                                        variant={field.state.value === unit ? 'primary' : 'outlined'}
                                        onPress={() => field.handleChange(unit)}
                                      />
                                    ))}
                                  </>
                                )}
                              </form.AppField>
                            </View>
                          </View>
                        )}

                        <CheckRow
                          checked={values.mode === 'kitchen_basic'}
                          label="Kitchen basic"
                          disabled={values.mode === 'measured' || values.mode === 'timed'}
                          onPress={() =>
                            modeField.handleChange(values.mode === 'kitchen_basic' ? 'counted' : 'kitchen_basic')
                          }
                        />
                      </View>
                    )}
                  </form.AppField>
                </>
              )}
            </form.Subscribe>

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

            {error ? (
              <Typography variant="body-sm" weight="bold" color={colors.red[500]}>
                {error}
              </Typography>
            ) : null}
          </View>
        </form.AppForm>
      </ScrollView>
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
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
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
  unitButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    height: 48,
    justifyContent: 'center',
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
