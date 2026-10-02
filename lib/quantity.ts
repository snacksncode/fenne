export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'fl_oz' | 'cup' | 'tbsp' | 'tsp' | 'qt' | 'oz' | 'lb' | 'count';

type LabelFn = (data: { count: number }) => string;
export const UNITS: { value: Unit; label: LabelFn }[] = [
  { value: 'count', label: ({ count }) => (count === 1 ? 'Piece' : 'Pieces') },
  { value: 'g', label: () => 'Grams' },
  { value: 'kg', label: () => 'Kilograms' },
  { value: 'ml', label: () => 'Milliliters' },
  { value: 'l', label: () => 'Liters' },
  { value: 'fl_oz', label: () => 'Fluid ounces' },
  { value: 'cup', label: ({ count }) => (count === 1 ? 'Cup' : 'Cups') },
  { value: 'tbsp', label: ({ count }) => (count === 1 ? 'Tablespoon' : 'Tablespoons') },
  { value: 'tsp', label: ({ count }) => (count === 1 ? 'Teaspoon' : 'Teaspoons') },
  { value: 'qt', label: ({ count }) => (count === 1 ? 'Quart' : 'Quarts') },
  { value: 'oz', label: () => 'Ounces' },
  { value: 'lb', label: () => 'Pounds' },
];

export const isUnit = (value: unknown): value is Unit =>
  typeof value === 'string' && UNITS.some((unit) => unit.value === value);

/** Draft input can be temporarily empty; submission validation remains explicit. */
export const parseLocaleFloat = (value: string): number =>
  parseFloat(value.replace(',', '.')) || 0;

/** Compact Unit text used alongside a displayed Quantity. */
export const prettyUnit = ({ quantity, unit }: { quantity: number; unit: Unit }): string => {
  switch (unit) {
    case 'count': return quantity === 1 ? 'pc' : 'pcs';
    case 'fl_oz': return 'fl oz';
    case 'cup': return quantity === 1 ? 'cup' : 'cups';
    case 'qt': return quantity === 1 ? 'qt' : 'qts';
    default: return unit;
  }
};

/** Accept a complete non-negative decimal, including a comma decimal separator. */
export const validQuantityText = (text: string, allowZero = true) => {
  const normalized = text.trim();
  const quantity = Number(normalized.replace(',', '.'));
  return /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(normalized)
    && Number.isFinite(quantity) && (allowZero ? quantity >= 0 : quantity > 0) && quantity <= 1_000_000_000;
};
