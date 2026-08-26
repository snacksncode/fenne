import { useAddPantryEntry } from '@/api/pantry';
import { ProductDTO } from '@/api/types';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { DateSelectInput } from '@/components/date-select-input';
import { useAppForm } from '@/components/form/app-form';
import { InlineQuantityInput } from '@/components/inline-quantity-input';
import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO } from '@/date-tools';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { prettyUnit } from '@/utils/unit-formatters';
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
  if (product.shape === 'timed') return 'Restock reminder';
  if (product.shape === 'counted') return 'Shopping item';
  return 'Tracked by measurement';
};

const pantryShape = (product: ProductDTO) => {
  if (product.shape === 'measured' || product.shape === 'timed') return product.shape;
  return 'counted';
};

const pantryAddSchema = z
  .object({
    productShape: z.enum(['counted', 'measured', 'timed']),
    quantity: z.string(),
    lastAcquired: z.string(),
  })
  .superRefine((value, context) => {
    if (value.productShape === 'timed') {
      if (dateToISO(value.lastAcquired.trim()) == null) {
        context.addIssue({ code: 'custom', path: ['lastAcquired'], message: 'Use YYYY-MM-DD' });
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
    form.setFieldValue('productShape', pantryShape(product));
    form.setFieldValue('quantity', product.shape === 'timed' ? '0' : '1');
    form.setFieldValue('lastAcquired', formatDateToISO(new Date()));
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
            accessibilityLabel="Go back"
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
          placeholder="Search shopping items"
          autoFocus
          productLabel={shapeLabel}
          listStyle={styles.searchList}
          listContentStyle={styles.searchListContent}
        />
      ) : selectedProduct ? (
        <View style={styles.detailsContent}>
          <View style={styles.selectedItem}>
            <ShoppingItemIdentity
              name={selectedProduct.name}
              aisle={selectedProduct.aisle}
              compact
            />
          </View>

          {isTimed ? (
            <form.AppForm>
              <View style={styles.field}>
                <form.AppField name="lastAcquired">
                  {(field) => (
                    <DateSelectInput
                      label="Last acquired"
                      value={field.state.value}
                      onPress={async () => {
                        const date = await sheets.present('select-date-sheet', {
                          data: { mode: 'select', initialDate: field.state.value },
                        });
                        if (date) field.handleChange(date);
                      }}
                    />
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
                    {(field) => {
                      const quantity = parseLocaleFloat(field.state.value);
                      const quantityError =
                        field.state.value.trim() !== '' && (!Number.isFinite(quantity) || quantity <= 0)
                          ? 'Quantity must be positive'
                          : null;

                      return (
                        <View style={styles.quantityField}>
                          <InlineQuantityInput
                            accessibilityLabel="Quantity remaining"
                            onBlur={field.handleBlur}
                            onChangeText={field.handleChange}
                            unit={unitLabel(selectedProduct, quantity)}
                            value={field.state.value}
                          />
                          {quantityError ? (
                            <View
                              accessible
                              accessibilityLabel={quantityError}
                              accessibilityLiveRegion="assertive"
                              accessibilityRole="alert"
                            >
                              <Typography variant="body-sm" weight="bold" color={colors.red[500]}>
                                {quantityError}
                              </Typography>
                            </View>
                          ) : null}
                        </View>
                      );
                    }}
                  </form.AppField>
                </View>
              </View>
            </form.AppForm>
          )}

          <form.Subscribe selector={(state) => state.errors.map(errorMessage).filter((message) => message != null)}>
            {(errors) =>
              errors[0] ? (
                <View
                  accessible
                  accessibilityLabel={errors[0]}
                  accessibilityLiveRegion="assertive"
                  accessibilityRole="alert"
                >
                  <Typography variant="body-sm" weight="bold" color={colors.red[500]}>
                    {errors[0]}
                  </Typography>
                </View>
              ) : null
            }
          </form.Subscribe>

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

const errorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return null;
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
    width: '100%',
  },
  quantityField: {
    gap: 6,
  },
});
