import { useMemo } from 'react';
import { RecipeDTO, MealType } from '@/api/types';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { createRecipeSearch } from '@/utils/recipe-utils';

/** Rebuild the Recipe index only when its catalog or meal filters change. */
export const useRecipeSearch = (
  recipes: RecipeDTO[] | undefined,
  { mealFilter, mealType, search = '' }: { mealFilter?: MealFilter; mealType?: MealType; search?: string }
) => {
  const index = useMemo(() => createRecipeSearch(recipes ?? [], { mealFilter, mealType }),
    [recipes, mealFilter, mealType]);
  return useMemo(() => index.search(search), [index, search]);
};
