import { PurchaseSuggestionDTO } from '@/api/types';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { suggestedPackCounts, usePackSelection } from '@/hooks/use-pack-selection';
import { parseLocaleFloat, validQuantityText } from '@/lib/quantity';
import { z } from 'zod';

type PurchaseQuantityOptions = {
  quantity: number;
  purchase?: PurchaseSuggestionDTO | null;
  overridden?: boolean;
  onSave: (quantity: number) => Promise<unknown> | void;
  onInvalid?: () => void;
};

/** Shared editing behavior for a Grocery List Entry and an inline Generation purchase. */
export const usePurchaseQuantity = ({ quantity, purchase, overridden, onSave, onInvalid }: PurchaseQuantityOptions) => {
  const feedback = useFormFeedback(['quantity']);
  const packs = usePackSelection(!overridden && quantity === purchase?.suggested_quantity
    ? suggestedPackCounts(purchase) : {});
  const focusQuantity = () => {
    feedback.focus('quantity');
    onInvalid?.();
  };
  const form = useAppForm({
    defaultValues: { quantity: String(quantity) },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    validators: {
      onSubmit: z.object({
        quantity: z.string().refine((text) => validQuantityText(text, !!purchase), purchase
          ? 'Enter an amount between 0 and 1,000,000,000.'
          : 'Enter an amount greater than 0, up to 1,000,000,000.'),
      }),
    },
    onSubmitInvalid: focusQuantity,
    onSubmit: async ({ value }) => {
      feedback.clearServerErrors(form);
      try {
        await onSave(parseLocaleFloat(value.quantity));
      } catch (caught) {
        feedback.reportError(form, caught, 'Could not save the amount. Try again.');
        onInvalid?.();
      }
    },
  });

  return {
    form,
    feedback,
    counts: packs.counts,
    resetPacks: packs.resetPacks,
    changePack: (size: number, delta: number) => form.setFieldValue('quantity', packs.changePack(size, delta)),
  };
};
