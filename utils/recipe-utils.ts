import { RecipeDTO, MealType } from '@/api/types';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';

const getRelevanceRank = (recipe: RecipeDTO, mealType: MealType) => {
  if (recipe.meal_types.length === 1 && recipe.meal_types[0] === mealType) return 2;
  if (recipe.meal_types.includes(mealType)) return 1;
  return 0;
};

export const sortRecipes = (recipes: RecipeDTO[], mealType?: MealType): RecipeDTO[] => {
  return [...recipes].sort((a, b) => {
    if (mealType) {
      const rankDiff = getRelevanceRank(b, mealType) - getRelevanceRank(a, mealType);
      if (rankDiff !== 0) return rankDiff;
    }
    return a.name.localeCompare(b.name);
  });
};

export const filterRecipes = (
  recipes: RecipeDTO[],
  opts: { mealFilter?: MealFilter; search?: string }
): RecipeDTO[] => {
  return recipes
    .filter((r) => !opts.mealFilter || opts.mealFilter === 'all' || r.meal_types.includes(opts.mealFilter))
    .filter((r) => !opts.search || r.name.toLowerCase().includes(opts.search.toLowerCase()));
};
