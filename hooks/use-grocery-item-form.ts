import { useAddGroceryItem, useEditGroceryItem } from '@/api/groceries';
import { GroceryItemDTO, GroceryItemFormData, GroceryItemInput } from '@/api/types';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { Unit, validQuantityText, parseLocaleFloat } from '@/lib/quantity';
import { z } from 'zod';

const emptyGroceryItem: GroceryItemFormData = {
  id: '', name: '', quantity: '1', unit: 'count', aisle: 'other',
  status: 'pending', product: null, source: 'manual', recipes: [],
};

const groceryItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name is required'),
  quantity: z.string().refine((value) => validQuantityText(value, false), 'Enter a quantity greater than 0, up to 1,000,000,000.'),
  unit: z.custom<Unit>(),
  aisle: z.custom<GroceryItemFormData['aisle']>(),
  product: z.custom<GroceryItemFormData['product']>(),
  source: z.custom<GroceryItemFormData['source']>(),
  status: z.custom<GroceryItemFormData['status']>(),
  recipes: z.custom<GroceryItemFormData['recipes']>(),
});

/** Owns the draft and commit rules for a manual Grocery List Entry. */
export const useGroceryItemForm = (entry: GroceryItemDTO | undefined, onSaved: () => Promise<void>) => {
  const add = useAddGroceryItem();
  const edit = useEditGroceryItem();
  const feedback = useFormFeedback(['name', 'quantity', 'unit', 'aisle'] as const);
  const form = useAppForm({
    defaultValues: entry ? { ...entry, quantity: String(entry.quantity) } : emptyGroceryItem,
    validators: { onSubmit: groceryItemSchema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value }) => {
      feedback.clearServerErrors(form);
      try {
        const quantity = parseLocaleFloat(value.quantity);
        if (entry) {
          await edit.mutateAsync({ id: entry.id, quantity, ...(value.product == null && { unit: value.unit }) });
        } else {
          const input: GroceryItemInput = value.product
            ? { type: 'product', product_id: value.product.id, unit: value.unit, quantity }
            : { type: 'custom', name: value.name.trim(), aisle: value.aisle, unit: value.unit, quantity };
          await add.mutateAsync(input);
        }
        await onSaved();
      } catch (error) {
        feedback.reportError(form, error, 'Could not save the grocery entry. Try again.');
      }
    },
  });
  return { form, feedback };
};
