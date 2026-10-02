import { useAddPantryEntry, useEditPantryEntry } from '@/api/pantry';
import { PantryEntryDTO, ProductDTO } from '@/api/types';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { formatDateToISO, parseISO, calendarDateToTimestamp } from '@/date-tools';
import { parseLocaleFloat } from '@/lib/quantity';
import { z } from 'zod';

const fields = ['quantity', 'lastAcquired'] as const;

const pantryEntrySchema = (isTimed: boolean) => z.object({
  quantity: z.string(),
  lastAcquired: z.string(),
}).superRefine((value, context) => {
  if (isTimed) {
    if (!calendarDateToTimestamp(value.lastAcquired.trim())) {
      context.addIssue({ code: 'custom', path: ['lastAcquired'], message: 'Use YYYY-MM-DD' });
    }
  } else {
    const quantity = parseLocaleFloat(value.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      context.addIssue({ code: 'custom', path: ['quantity'], message: 'Quantity must be positive' });
    }
  }
});

/** One draft owns stock quantities or replacement timing, including request feedback. */
export const usePantryEntryForm = ({ product, entry, onSaved }: {
  product: ProductDTO | null;
  entry?: PantryEntryDTO;
  onSaved: () => void | Promise<void>;
}) => {
  const addEntry = useAddPantryEntry();
  const editEntry = useEditPantryEntry();
  const feedback = useFormFeedback(fields);
  const isTimed = product?.shape === 'timed';
  const form = useAppForm({
    defaultValues: {
      quantity: entry?.quantity_remaining.toString() ?? '1',
      lastAcquired: formatDateToISO(entry?.last_acquired ? parseISO(entry.last_acquired) : new Date()),
    },
    validators: { onSubmit: pantryEntrySchema(isTimed) },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      if (!product) return;
      feedback.clearServerErrors(formApi);
      const changes = isTimed
        ? { last_acquired: calendarDateToTimestamp(value.lastAcquired.trim())! }
        : { quantity_remaining: parseLocaleFloat(value.quantity) };
      try {
        if (entry) await editEntry.mutateAsync({ id: entry.id, ...changes });
        else await addEntry.mutateAsync({ product_id: product.id, ...changes });
        await onSaved();
      } catch (error) {
        feedback.reportError(formApi, error, `Could not ${entry ? 'update' : 'add'} pantry stock`, {
          quantity_remaining: 'quantity', last_acquired: 'lastAcquired',
        });
      }
    },
  });

  return { form, feedback, isTimed };
};
