import type { PurchaseSuggestionDTO } from '@/api/types';
import { z } from 'zod';

import { validQuantityText } from '@/lib/quantity';

export const validGenerationAmount = validQuantityText;

const amount = z.string().refine(validGenerationAmount, 'Enter an amount between 0 and 1,000,000,000.');
export const generationAmountsSchema = z.object({ pantry: amount, quantity: amount.nullable() });

// Null is automatic buying; an entered string (including "0") is a manual choice.
// A pending or stale projection must never replace that choice or display the wrong calculation.
export const generationBuyingText = ({ quantity, pantry, needed, projection }: {
  quantity: string | null;
  pantry: string;
  needed: number;
  projection?: PurchaseSuggestionDTO;
}): string | undefined => {
  if (quantity !== null) return quantity;
  if (!validGenerationAmount(pantry)) return undefined;
  const stock = Number(pantry.trim().replace(',', '.'));
  if (stock >= needed) return '0';
  if (projection?.pantry !== stock || projection.needed !== needed) return undefined;
  return String(Math.max(0, projection.suggested_quantity));
};
