import { pantryQuery, useAddPantryEntry, useEditPantryEntry } from '@/api/pantry';
import { purchaseSuggestionQuery } from '@/api/products';
import { queryKeys } from '@/api/query-keys';
import { PantryEntryDTO } from '@/api/types';
import { generationAmountsSchema, generationBuyingText, validGenerationAmount } from '@/components/bottomSheets/generation-amounts-model';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { suggestedPackCounts, usePackSelection } from '@/hooks/use-pack-selection';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/lib/quantity';
import { useStore } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Keyboard } from 'react-native';

export const useGenerationAmounts = ({ data, sheetId }: SheetProps<'generation-amounts-sheet'>) => {
  const { product, purchase, quantity, overridden } = data;
  const sheets = useSheets();
  const queryClient = useQueryClient();
  const addPantry = useAddPantryEntry();
  const editPantry = useEditPantryEntry();
  const pantry = useQuery({ ...pantryQuery, staleTime: 0, refetchOnMount: 'always' });
  // This is the draft's fixed starting point, not a second live Pantry cache.
  // Ignore cached stock until this opening has fetched a fresh result.
  const [baseline, setBaseline] = useState<{ entry?: PantryEntryDTO }>();
  if (!baseline && pantry.isFetchedAfterMount && pantry.isSuccess) {
    setBaseline({ entry: pantry.data.find((entry) => entry.product_id === product.id) });
  }
  const initialPantry = baseline?.entry?.quantity_remaining ?? 0;
  const feedback = useFormFeedback(['quantity', 'pantry'] as const);
  const packs = usePackSelection();
  const form = useAppForm({
    defaultValues: { pantry: String(initialPantry), quantity: overridden ? String(quantity) : null as string | null },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    validators: { onSubmit: generationAmountsSchema },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value }) => {
      if (!baseline) return;
      feedback.clearServerErrors(form);
      try {
        const stock = parseLocaleFloat(value.pantry);
        // Resolve the exact draft before writing, even if a debounced preview is still pending.
        if (value.quantity === null) {
          await queryClient.fetchQuery(purchaseSuggestionQuery(product.id, purchase.needed, stock));
        }
        if (stock !== initialPantry) {
          const entries = await queryClient.fetchQuery({ ...pantryQuery, staleTime: 0 });
          const current = entries.find((entry) => entry.product_id === product.id);
          if (current) await editPantry.mutateAsync({ id: current.id, quantity_remaining: stock });
          else if (stock > 0) await addPantry.mutateAsync({ product_id: product.id, quantity_remaining: stock });
          await queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
        }
        Keyboard.dismiss();
        await sheets.dismiss(sheetId, { quantity: value.quantity === null ? null : parseLocaleFloat(value.quantity) });
      } catch (caught) {
        feedback.reportError(form, caught, 'Could not save amounts. Try again.', { quantity_remaining: 'pantry' });
      }
    },
  });
  const pantryText = useStore(form.store, (state) => state.values.pantry);
  const buyingOverride = useStore(form.store, (state) => state.values.quantity);
  const debouncedPantry = useDebouncedValue(pantryText, 200);
  const projection = useQuery({
    ...purchaseSuggestionQuery(product.id, purchase.needed, parseLocaleFloat(debouncedPantry)),
    enabled: !!baseline && validGenerationAmount(debouncedPantry),
    retry: false,
  });
  const currentProjection = [projection.data, purchase].find((candidate) =>
    candidate?.pantry === parseLocaleFloat(pantryText) && candidate.needed === purchase.needed);
  const buyingText = generationBuyingText({ quantity: buyingOverride, pantry: pantryText,
    needed: purchase.needed, projection: currentProjection });
  const automatic = buyingOverride === null;
  const calculating = automatic && validGenerationAmount(pantryText) && buyingText === undefined
    && (pantryText !== debouncedPantry || projection.isFetching);
  const counts = automatic ? suggestedPackCounts(currentProjection) : packs.counts;

  return {
    form,
    feedback,
    ready: !!baseline,
    loadError: !baseline && pantry.isError,
    retry: pantry.refetch,
    buyingText: buyingText ?? '',
    calculating,
    calculationError: automatic && buyingText === undefined && validGenerationAmount(pantryText) && projection.isError,
    counts,
    resetPacks: packs.resetPacks,
    changePack: (size: number, delta: number) => form.setFieldValue('quantity', packs.changePack(size, delta, counts)),
  };
};
