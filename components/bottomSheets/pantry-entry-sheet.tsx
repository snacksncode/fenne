import { useDeletePantryEntry, useEditPantryEntry } from '@/api/pantry';
import { PantryEntryDTO } from '@/api/types';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { ReminderFrequencyFields, ReminderFrequencyUnit } from '@/components/reminder-frequency-fields';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO } from '@/date-tools';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { prettyUnit } from '@/utils/unit-formatters';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { z } from 'zod';

const initialDate = (entry: PantryEntryDTO) => {
  if (!entry.last_acquired) return formatDateToISO(new Date());
  return format(parseISO(entry.last_acquired), 'yyyy-MM-dd');
};

const dateToISO = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return `${date}T00:00:00.000Z`;
};

const entryUnitLabel = (entry: PantryEntryDTO, quantity: number) => {
  if (entry.product.shape === 'counted') return quantity === 1 ? 'item' : 'items';
  return prettyUnit({ quantity, unit: entry.product.unit });
};

const pantryEntrySchema = z.object({
  quantity: z.string().refine((value) => {
    const quantity = parseLocaleFloat(value);
    return Number.isFinite(quantity) && quantity >= 0;
  }, 'Quantity cannot be negative'),
  lastAcquired: z.string().refine((value) => dateToISO(value.trim()) != null, 'Use YYYY-MM-DD'),
  reminderFrequencyValue: z.string().refine((value) => {
    const frequency = parseInt(value, 10);
    return Number.isFinite(frequency) && frequency > 0;
  }, 'Reminder frequency must be greater than 0'),
  reminderFrequencyUnit: z.enum(['days', 'weeks', 'months']),
});

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
  const form = useAppForm({
    defaultValues: {
      quantity: entry.quantity_remaining.toString(),
      lastAcquired: initialDate(entry),
      reminderFrequencyValue: entry.product.reminder_frequency_value?.toString() ?? '1',
      reminderFrequencyUnit: entry.product.reminder_frequency_unit ?? 'months',
    },
    validators: {
      onSubmit: pantryEntrySchema,
    },
    onSubmit: ({ value }) => {
      setError(null);

      if (isTimed) {
        const isoDate = dateToISO(value.lastAcquired.trim());
        if (!isoDate) return;

        const parsedReminderFrequency = parseInt(value.reminderFrequencyValue, 10);

        editEntry.mutate(
          {
            id: entry.id,
            last_acquired: isoDate,
            reminder_frequency_value: parsedReminderFrequency,
            reminder_frequency_unit: value.reminderFrequencyUnit,
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

  const handleRemove = () => {
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

  return (
    <BaseSheet
      id={sheetId}
      footer={sheetFooter.buttonRow(
        <View style={styles.footer}>
          <Button
            text="Remove"
            variant="red-outlined"
            onPress={handleRemove}
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

      <form.AppForm>
        {isTimed ? (
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
              {(frequencyField) => (
                <form.AppField name="reminderFrequencyUnit">
                  {(unitField) => (
                    <ReminderFrequencyFields
                      value={frequencyField.state.value}
                      unit={unitField.state.value as ReminderFrequencyUnit}
                      onValueChange={frequencyField.handleChange}
                      onUnitChange={unitField.handleChange}
                    />
                  )}
                </form.AppField>
              )}
            </form.AppField>
          </View>
        ) : (
          <View style={styles.field}>
            <form.AppField name="quantity">
              {(field) => (
                <View>
                  <Typography variant="body-sm" weight="bold" style={{ marginBottom: 8 }}>
                    Quantity remaining
                  </Typography>
                  <View style={styles.quantityRow}>
                    <field.NumberField
                      containerStyle={styles.quantityInput}
                      placeholder="0"
                      style={styles.quantityInputControl}
                    />
                    <View style={styles.unitPill}>
                      <Typography variant="body-base" weight="bold" color={colors.brown[900]} numberOfLines={1}>
                        {entryUnitLabel(entry, parseLocaleFloat(field.state.value))}
                      </Typography>
                    </View>
                  </View>
                </View>
              )}
            </form.AppField>
          </View>
        )}
      </form.AppForm>

      <form.Subscribe selector={(state) => state.errors.map(errorMessage).filter((message) => message != null)}>
        {(errors) =>
          errors[0] ? (
            <Typography variant="body-sm" weight="bold" color={colors.red[500]} style={{ marginTop: 12 }}>
              {errors[0]}
            </Typography>
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
    gap: 2,
    marginBottom: 20,
  },
  field: {
    gap: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
    minWidth: 104,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
});
