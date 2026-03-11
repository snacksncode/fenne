import { Unit } from '@/components/bottomSheets/select-unit-sheet';

export const unitFormatters: Record<Unit, (data: { count: number }) => string> = {
  count: ({ count }) => (count <= 1 ? 'pc' : 'pcs'),
  g: () => 'g',
  kg: () => 'kg',
  ml: () => 'ml',
  l: () => 'l',
  fl_oz: () => 'fl oz',
  cup: ({ count }) => (count === 1 ? 'cup' : 'cups'),
  tbsp: () => 'tbsp',
  tsp: () => 'tsp',
  qt: ({ count }) => (count === 1 ? 'qt' : 'qts'),
  oz: () => 'oz',
  lb: () => 'lb',
};

export function prettyUnit({ quantity, unit }: { quantity: number; unit: Unit }): string {
  switch (unit) {
    case 'count':
      return quantity === 1 ? 'pc' : 'pcs';
    case 'fl_oz':
      return 'fl oz';
    case 'cup':
      return quantity === 1 ? 'cup' : 'cups';
    case 'qt':
      return quantity === 1 ? 'qt' : 'qts';
    default:
      return unit;
  }
}
