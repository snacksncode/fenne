import { useDeletePantryEntry, useEditPantryEntry } from '@/api/pantry';
import { PantryEntryDTO } from '@/api/types';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { DateSelectInput } from '@/components/date-select-input';
import { useAppForm } from '@/components/form/app-form';
import { InlineQuantityInput } from '@/components/inline-quantity-input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO, parseISO } from '@/date-tools';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { prettyUnit } from '@/utils/unit-formatters';
import { Pen, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { z } from 'zod';

const POSITIVE_QUANTITY_ERROR = 'Quantity must be positive';

const initialDate = (entry: PantryEntryDTO) => {
  if (!entry.last_acquired) return formatDateToISO(new Date());
  return formatDateToISO(parseISO(entry.last_acquired));
};

const pantryEntrySchema = (isTimed: boolean) =>
  z
    .object({
      quantity: z.string(),
      lastAcquired: z.string(),
    })
    .superRefine((value, context) => {
      if (isTimed) {
        if (Number.isNaN(parseISO(value.lastAcquired.trim()).getTime())) {
          context.addIssue({ code: 'custom', path: ['lastAcquired'], message: 'Use YYYY-MM-DD' });
        }

        return;
      }

      const quantity = parseLocaleFloat(value.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        context.addIssue({ code: 'custom', path: ['quantity'], message: POSITIVE_QUANTITY_ERROR });
      }
    });

const entryUnitLabel = (entry: PantryEntryDTO, quantity: number) => {
  if (entry.product.shape === 'counted') return quantity === 1 ? 'item' : 'items';
  return prettyUnit({ quantity, unit: entry.product.unit });
};

type PantryEntrySheetContentProps = {
  sheetId: SheetProps<'pantry-entry-sheet'>['sheetId'];
  entry: PantryEntryDTO;
};

const PantryEntrySheetContent = ({ sheetId, entry }: PantryEntrySheetContentProps) => {
  const sheets = useSheets();
  const editEntry = useEditPantryEntry();
  const deleteEntry = useDeletePantryEntry();
  const [error, setError] = useState<string | null>(null);

  const isTimed = entry.product.shape === 'timed';
  const performRemove = () => {
    setError(null);
    deleteEntry.mutate(
      { id: entry.id },
      {
        onSuccess: () => {
          Keyboard.dismiss();
          sheets.dismiss(sheetId);
        },
        onError: () => setError('Could not remove pantry stock'),
      }
    );
  };

  const form = useAppForm({
    defaultValues: {
      quantity: entry.quantity_remaining.toString(),
      lastAcquired: initialDate(entry),
    },
    validators: {
      onSubmit: pantryEntrySchema(isTimed),
    },
    onSubmit: ({ value }) => {
      setError(null);

      if (isTimed) {
        editEntry.mutate(
          {
            id: entry.id,
            last_acquired: formatDateToISO(parseISO(value.lastAcquired.trim())),
          },
          {
            onSuccess: () => {
              Keyboard.dismiss();
              sheets.dismiss(sheetId);
            },
            onError: () => setError('Could not update pantry stock'),
          }
        );
        return;
      }

      const parsedQuantity = parseLocaleFloat(value.quantity);

      editEntry.mutate(
        { id: entry.id, quantity_remaining: parsedQuantity },
        {
          onSuccess: () => {
            Keyboard.dismiss();
            sheets.dismiss(sheetId);
          },
          onError: () => setError('Could not update pantry stock'),
        }
      );
    },
  });

  const handleEditProduct = async () => {
    Keyboard.dismiss();
    const product = entry.product;
    await sheets.dismiss(sheetId);
    sheets.present('product-edit-sheet', { data: { product } });
  };

  return (
    <BaseSheet
      id={sheetId}
      footer={sheetFooter.buttonRow(
        <View style={styles.footer}>
          <Button
            text="Remove"
            variant="red-outlined"
            onPress={performRemove}
            leftIcon={{ Icon: Trash2 }}
            isLoading={deleteEntry.isPending}
            style={{ flex: 1 }}
          />
          <Button
            text="Save"
            variant="primary"
            onPress={() => form.handleSubmit()}
            isLoading={editEntry.isPending}
            style={{ flex: 1 }}
          />
        </View>
      )}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Typography variant="heading-sm" weight="bold">
            {entry.product.name}
          </Typography>
          <form.Subscribe selector={(state) => state.values.quantity}>
            {(quantity) => (
              <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
                {isTimed ? 'Reminder item' : `Tracked as ${entryUnitLabel(entry, parseLocaleFloat(quantity))}`}
              </Typography>
            )}
          </form.Subscribe>
        </View>
        <Button
          text="Edit item"
          variant="outlined"
          size="small"
          leftIcon={{ Icon: Pen }}
          onPress={handleEditProduct}
        />
      </View>

      <form.AppForm>
        {isTimed ? (
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
        ) : (
          <View style={styles.field}>
            <form.AppField name="quantity">
              {(field) => {
                const quantity = parseLocaleFloat(field.state.value);
                const quantityError =
                  field.state.value.trim() !== '' && (!Number.isFinite(quantity) || quantity <= 0)
                    ? POSITIVE_QUANTITY_ERROR
                    : null;

                return (
                  <View style={styles.quantityField}>
                    <Typography variant="body-sm" weight="bold" style={{ marginBottom: 8 }}>
                      Quantity remaining
                    </Typography>
                    <View style={styles.quantityRow}>
                      <InlineQuantityInput
                        accessibilityLabel="Quantity remaining"
                        onBlur={field.handleBlur}
                        onChangeText={(value) => {
                          setError(null);
                          field.handleChange(value);
                        }}
                        unit={entryUnitLabel(entry, parseLocaleFloat(field.state.value))}
                        value={field.state.value}
                      />
                    </View>
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
        )}
      </form.AppForm>

      <form.Subscribe selector={(state) => state.errors.map(errorMessage).filter((message) => message != null)}>
        {(errors) =>
          errors[0] && (isTimed || errors[0] !== POSITIVE_QUANTITY_ERROR) ? (
            <View
              accessible
              accessibilityLabel={errors[0]}
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
            >
              <Typography variant="body-sm" weight="bold" color={colors.red[500]} style={{ marginTop: 12 }}>
                {errors[0]}
              </Typography>
            </View>
          ) : null
        }
      </form.Subscribe>

      {error ? (
        <Typography variant="body-sm" weight="bold" color={colors.red[500]} style={{ marginTop: 12 }}>
          {error}
        </Typography>
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

export const PantryEntrySheet = (props: SheetProps<'pantry-entry-sheet'>) => {
  return <PantryEntrySheetContent sheetId={props.sheetId} entry={props.data.entry} />;
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    gap: 2,
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
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
});
