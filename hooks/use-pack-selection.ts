import { useState } from 'react';
import { PurchaseSuggestionDTO } from '@/api/types';

export type PackCounts = Record<string, number>;

export const suggestedPackCounts = (purchase?: PurchaseSuggestionDTO | null): PackCounts =>
  Object.fromEntries((purchase?.packs ?? []).map(({ size, count }) => [size, count]));

/** Keeps the pack selection local; the form remains the owner of the chosen total. */
export const usePackSelection = (initialCounts: PackCounts = {}) => {
  const [counts, setCounts] = useState(initialCounts);

  const changePack = (size: number, delta: number, current = counts) => {
    const next: PackCounts = { ...current, [size]: Math.max(0, (current[size] ?? 0) + delta) };
    setCounts(next);
    const total = Object.entries(next).reduce((sum, [size, count]) => sum + Number(size) * count, 0);
    return String(Number(total.toFixed(3)));
  };

  return { counts, changePack, resetPacks: () => setCounts({}) };
};
