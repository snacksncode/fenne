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
  pt: ({ count }) => (count === 1 ? 'pt' : 'pts'),
  qt: ({ count }) => (count === 1 ? 'qt' : 'qts'),
  oz: () => 'oz',
  lb: () => 'lb',
};
