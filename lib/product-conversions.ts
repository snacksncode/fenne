import { ProductDTO, ProductDraft } from '@/api/types';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';

type ConvertibleProduct = ProductDTO | ProductDraft;

// Mirrors backend Conversion::DIMENSIONS for immediate UI feedback; recipe validation remains authoritative.
const UNIT_DIMENSIONS: Record<Unit, string> = {
  g: 'mass_metric',
  kg: 'mass_metric',
  oz: 'mass_imperial',
  lb: 'mass_imperial',
  ml: 'volume_metric',
  l: 'volume_metric',
  tsp: 'spoon',
  tbsp: 'spoon',
  fl_oz: 'volume_imperial',
  cup: 'volume_imperial',
  qt: 'volume_imperial',
  count: 'count',
};

const isMeasuredProduct = (product: ConvertibleProduct) =>
  !product.is_kitchen_basic &&
  product.reminder_frequency_value == null &&
  product.quantity != null &&
  product.unit !== 'count';

export type ProductConversionRequirement = {
  ingredientUnit: Unit;
  productUnit: Unit;
};

export const unitsRequireProductConversion = (ingredientUnit: Unit, productUnit: Unit) =>
  ingredientUnit !== 'count' && UNIT_DIMENSIONS[ingredientUnit] !== UNIT_DIMENSIONS[productUnit];

export const productConversionRequirement = (
  product: ConvertibleProduct,
  ingredientUnit: Unit
): ProductConversionRequirement | null => {
  if (!isMeasuredProduct(product) || !unitsRequireProductConversion(ingredientUnit, product.unit)) return null;

  const conversion = product.conversions?.[ingredientUnit];
  if (conversion != null && Number.isFinite(conversion) && conversion > 0) return null;

  return { ingredientUnit, productUnit: product.unit };
};

export const withProductConversion = <T extends ConvertibleProduct>(
  product: T,
  ingredientUnit: Unit,
  value: number
): T => ({
  ...product,
  conversions: {
    ...product.conversions,
    [ingredientUnit]: value,
  },
});

export const conversionValuesPayload = (values: Partial<Record<Unit, string>>) =>
  Object.fromEntries(
    Object.entries(values)
      .map(([unit, value]) => [unit, Number(value.replace(',', '.'))] as const)
      .filter((entry): entry is [string, number] => Number.isFinite(entry[1]) && entry[1] > 0)
  );
