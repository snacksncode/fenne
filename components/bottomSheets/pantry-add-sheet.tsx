import { useAddPantryEntry } from '@/api/pantry';
import { ProductDTO } from '@/api/types';
import { AisleIcon } from '@/components/aisle-header';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { ReminderFrequencyFields, ReminderFrequencyUnit } from '@/components/reminder-frequency-fields';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO } from '@/date-tools';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { prettyUnit } from '@/utils/unit-formatters';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { z } from 'zod';

type Phase = 'select' | 'details';

const dateToISO = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return `${date}T00:00:00.000Z`;
};

const unitLabel = (product: ProductDTO, quantity: number) => {
  if (product.shape === 'counted') return quantity === 1 ? 'item' : 'items';
  return prettyUnit({ quantity, unit: product.unit });
};

const shapeLabel = (product: ProductDTO) => {
  if (product.shape === 'timed') return 'Reminder item';
  if (product.shape === 'counted') return 'Counted item';
  return 'Measured item';
};

const pantryAddSchema = z
  .object({
    productShape: z.enum(['counted', 'measured', 'timed']),
    quantity: z.string(),
    lastAcquired: z.string(),
    reminderFrequencyValue: z.string(),
    reminderFrequencyUnit: z.enum(['days', 'weeks', 'months']),
  })
  .superRefine((value, context) => {
    if (value.productShape === 'timed') {
      if (dateToISO(value.lastAcquired.trim()) == null) {
        context.addIssue({ code: 'custom', path: ['lastAcquired'], message: 'Use YYYY-MM-DD' });
      }

      const frequency = parseInt(value.reminderFrequencyValue, 10);
      if (!Number.isFinite(frequency) || frequency <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['reminderFrequencyValue'],
          message: 'Reminder frequency must be greater than 0',
        });
      }
      return;
    }

    const quantity = parseLocaleFloat(value.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      context.addIssue({ code: 'custom', path: ['quantity'], message: 'Quantity must be positive' });
    }
  });

export const PantryAddSheet = (props: SheetProps<'pantry-add-sheet'>) => {
  const sheets = useSheets();
  const addPantryEntry = useAddPantryEntry();
  const [phase, setPhase] = useState<Phase>('select');
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTimed = selectedProduct?.shape === 'timed';
  const form = useAppForm({
    defaultValues: {
      productShape: 'counted' as 'counted' | 'measured' | 'timed',
      quantity: '1',
      lastAcquired: formatDateToISO(new Date()),
      reminderFrequencyValue: '1',
      reminderFrequencyUnit: 'months' as ReminderFrequencyUnit,
    },
    validators: {
      onSubmit: pantryAddSchema,
    },
    onSubmit: ({ value }) => {
      if (!selectedProduct) return;
      setError(null);

      if (selectedProduct.shape === 'timed') {
        const isoDate = dateToISO(value.lastAcquired.trim());
        if (!isoDate) return;

        addPantryEntry.mutate(
          {
            product_id: selectedProduct.id,
            last_acquired: isoDate,
            reminder_frequency_value: parseInt(value.reminderFrequencyValue, 10),
            reminder_frequency_unit: value.reminderFrequencyUnit,
          },
          {
            onSuccess: () => {
              Keyboard.dismiss();
              sheets.dismiss(props.sheetId);
            },
            onError: () => setError('Could not add pantry stock'),
          }
        );
        return;
      }

      addPantryEntry.mutate(
        { product_id: selectedProduct.id, quantity_remaining: parseLocaleFloat(value.quantity) },
        {
          onSuccess: () => {
            Keyboard.dismiss();
            sheets.dismiss(props.sheetId);
          },
          onError: () => setError('Could not add pantry stock'),
        }
      );
    },
  });

  const handleSelectProduct = (choice: ProductChoice) => {
    if (choice.kind !== 'product') return;

    const product = choice.product;
    setSelectedProduct(product);
    form.setFieldValue('productShape', product.shape === 'measured' || product.shape === 'timed' ? product.shape : 'counted');
    form.setFieldValue('quantity', product.shape === 'timed' ? '0' : '1');
    form.setFieldValue('lastAcquired', format(new Date(), 'yyyy-MM-dd'));
    form.setFieldValue('reminderFrequencyValue', product.reminder_frequency_value?.toString() ?? '1');
    form.setFieldValue('reminderFrequencyUnit', product.reminder_frequency_unit ?? 'months');
    setError(null);
    setPhase('details');
    Keyboard.dismiss();
  };

  const handleBack = () => {
    setPhase('select');
    setSelectedProduct(null);
    setError(null);
  };

  return (
    <BaseSheet
      id={props.sheetId}
      footer={
        phase === 'details'
          ? sheetFooter.buttonRow(
              <Button
                text="Add stock"
                variant="primary"
                rightIcon={{ Icon: ArrowRight }}
                onPress={() => form.handleSubmit()}
                isLoading={addPantryEntry.isPending}
              />
            )
          : undefined
      }
    >
      <View style={styles.header}>
        {phase === 'details' && (
          <Button
            size="small"
            variant="outlined"
            leftIcon={{ Icon: ArrowLeft }}
            onPress={handleBack}
            style={{ paddingHorizontal: 0, width: 42 }}
          />
        )}
        <Typography variant="heading-sm" weight="bold">
          Add Stock
        </Typography>
      </View>

      {phase === 'select' ? (
        <ProductSearchStep
          context="pantry"
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelectProduct}
          placeholder="Search products"
          autoFocus
          productLabel={shapeLabel}
          listStyle={styles.searchList}
          listContentStyle={styles.searchListContent}
        />
      ) : selectedProduct ? (
        <View style={styles.detailsContent}>
          <View style={styles.selectedItem}>
            <AisleIcon type={selectedProduct.aisle} />
            <View style={{ flex: 1 }}>
              <Typography variant="body-base" weight="bold" numberOfLines={1}>
                {selectedProduct.name}
              </Typography>
              <Typography variant="body-xs" weight="regular" color={colors.brown[700]} style={{ marginTop: -4 }}>
                {shapeLabel(selectedProduct)}
              </Typography>
            </View>
          </View>

          {isTimed ? (
            <form.AppForm>
              <View style={styles.field}>
                <form.AppField name="lastAcquired">
                  {(field) => (
                    <field.TextField
                      label="Last acquired"
                      placeholder="YYYY-MM-DD"
                      keyboardType="numbers-and-punctuation"
                    />
                  )}
                </form.AppField>
                <form.AppField name="reminderFrequencyValue">
                  {(valueField) => (
                    <form.AppField name="reminderFrequencyUnit">
                      {(unitField) => (
                        <ReminderFrequencyFields
                          value={valueField.state.value}
                          unit={unitField.state.value}
                          onValueChange={valueField.handleChange}
                          onUnitChange={unitField.handleChange}
                        />
                      )}
                    </form.AppField>
                  )}
                </form.AppField>
              </View>
            </form.AppForm>
          ) : (
            <form.AppForm>
              <View style={styles.field}>
                <Typography variant="body-sm" weight="bold">
                  Quantity remaining
                </Typography>
                <View style={styles.quantityRow}>
                  <form.AppField name="quantity">
                    {(field) => (
                      <field.NumberField
                        containerStyle={styles.quantityInput}
                        placeholder="0"
                        style={styles.quantityInputControl}
                      />
                    )}
                  </form.AppField>
                  <form.Subscribe selector={(state) => state.values.quantity}>
                    {(quantity) => (
                      <View style={styles.unitPill}>
                        <Typography variant="body-base" weight="bold" color={colors.brown[900]} numberOfLines={1}>
                          {unitLabel(selectedProduct, parseLocaleFloat(quantity))}
                        </Typography>
                      </View>
                    )}
                  </form.Subscribe>
                </View>
              </View>
            </form.AppForm>
          )}

          {error ? (
            <Typography variant="body-sm" weight="bold" color={colors.red[500]}>
              {error}
            </Typography>
          ) : null}
        </View>
      ) : null}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchList: {
    maxHeight: 240,
  },
  searchListContent: {
    gap: 8,
    paddingBottom: 4,
  },
  detailsContent: {
    gap: 16,
  },
  selectedItem: {
    alignItems: 'center',
    backgroundColor: '#FEF2DD',
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  field: {
    gap: 8,
  },
  quantityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 1,
    minWidth: 0,
  },
  quantityInputControl: {
    fontSize: 22,
    textAlign: 'center',
  },
  unitPill: {
    alignItems: 'center',
    backgroundColor: colors.cream[100],
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    height: 48,
    justifyContent: 'center',
    minWidth: 104,
    paddingHorizontal: 12,
  },
});
