import { APIError } from '@/api/client';
import { MissingRecipeConversionDTO, ProductDeleteBlockersDTO, RecipeDTO } from '@/api/types';
import { isUnit, Unit } from '@/components/bottomSheets/select-unit-sheet';

const apiErrorData = (error: unknown) => (error instanceof APIError ? error.data : null);

export const productImpactFromError = (error: unknown): string[] | null => {
  const data = apiErrorData(error);
  if (!data || typeof data !== 'object' || !('impact' in data) || !Array.isArray(data.impact)) return null;

  return data.impact.filter((item): item is string => typeof item === 'string');
};

export const missingProductConversionsFromError = (error: unknown): Unit[] | null => {
  const data = apiErrorData(error);
  if (
    !data ||
    typeof data !== 'object' ||
    !('missing_conversions' in data) ||
    !Array.isArray(data.missing_conversions) ||
    !data.missing_conversions.every(isUnit)
  ) {
    return null;
  }

  return data.missing_conversions;
};

export const missingRecipeConversionsFromError = (error: unknown): MissingRecipeConversionDTO[] | null => {
  const data = apiErrorData(error);
  if (!data || typeof data !== 'object' || !('missing_conversions' in data)) return null;

  const conversions = data.missing_conversions;
  if (!Array.isArray(conversions)) return null;

  const valid = conversions.filter(
    (conversion): conversion is MissingRecipeConversionDTO =>
      conversion != null &&
      typeof conversion === 'object' &&
      'ingredient_index' in conversion &&
      typeof conversion.ingredient_index === 'number' &&
      Number.isInteger(conversion.ingredient_index) &&
      conversion.ingredient_index >= 0 &&
      'product_id' in conversion &&
      (conversion.product_id === null || typeof conversion.product_id === 'string') &&
      'product_name' in conversion &&
      typeof conversion.product_name === 'string' &&
      'ingredient_unit' in conversion &&
      isUnit(conversion.ingredient_unit) &&
      'product_unit' in conversion &&
      isUnit(conversion.product_unit)
  );

  return valid.length === conversions.length ? valid : null;
};

const isRecipe = (value: unknown): value is RecipeDTO =>
  value != null &&
  typeof value === 'object' &&
  'id' in value &&
  typeof value.id === 'string' &&
  'name' in value &&
  typeof value.name === 'string' &&
  'meal_types' in value &&
  Array.isArray(value.meal_types) &&
  value.meal_types.every((mealType) => mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') &&
  'ingredients' in value &&
  Array.isArray(value.ingredients) &&
  'time_in_minutes' in value &&
  typeof value.time_in_minutes === 'number' &&
  'liked' in value &&
  typeof value.liked === 'boolean' &&
  'notes' in value &&
  typeof value.notes === 'string';

export const productDeleteBlockersFromError = (error: unknown): ProductDeleteBlockersDTO | null => {
  const data = apiErrorData(error);
  if (!data || typeof data !== 'object' || !('recipes' in data) || !Array.isArray(data.recipes)) return null;
  if (!data.recipes.every(isRecipe)) return null;

  const base = 'base' in data && Array.isArray(data.base) ? data.base.filter((value): value is string => typeof value === 'string') : [];
  const groceryItems =
    'grocery_items' in data && Array.isArray(data.grocery_items)
      ? data.grocery_items.filter(
          (value): value is { id: string; name: string } =>
            value != null &&
            typeof value === 'object' &&
            'id' in value &&
            typeof value.id === 'string' &&
            'name' in value &&
            typeof value.name === 'string'
        )
      : [];
  const pantryEntries =
    'pantry_entries' in data && Array.isArray(data.pantry_entries)
      ? data.pantry_entries.filter(
          (value): value is { id: string } =>
            value != null && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
        )
      : [];

  return { base, recipes: data.recipes, grocery_items: groceryItems, pantry_entries: pantryEntries };
};
