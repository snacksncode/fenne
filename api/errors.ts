import { APIError } from '@/api/client';
import { MissingRecipeConversionDTO } from '@/api/types';
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
