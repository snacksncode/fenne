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
  product.unit !== 'count';

export type ProductConversionRequirement = {
  ingredientUnit: Unit;
  productUnit: Unit;
};

export const unitsRequireProductConversion = (ingredientUnit: Unit, productUnit: Unit) =>
  UNIT_DIMENSIONS[ingredientUnit] !== UNIT_DIMENSIONS[productUnit];

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

// Convert configured sizes with their tracking unit; incompatible dimensions start empty.
export const convertPackSizeInputs = (values: string[], from: Unit, to: Unit): string[] => {
  if (from === to) return values;
  if (unitsRequireProductConversion(from, to)) return [];
  const factors: Partial<Record<Unit, number>> = { g: 1, kg: 1000, oz: 1, lb: 16, ml: 1, l: 1000, tsp: 1, tbsp: 3, fl_oz: 1, cup: 8, qt: 32 };
  return values.map((value) => {
    const amount = Number(value.replace(',', '.')) * (factors[from] ?? 1) / (factors[to] ?? 1);
    return Number.isFinite(amount) && amount > 0 ? String(Number(amount.toFixed(3))) : value;
  });
};
