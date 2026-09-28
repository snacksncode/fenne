/// <reference types="jest" />
import type { ProductCatalog, ProductDTO } from '@/api/types';
import { searchProductCatalog } from './product-search';

const product = (name: string, basic = false): ProductDTO => ({
  id: name, name, aisle: 'produce', unit: 'count', is_kitchen_basic: basic,
  shape: basic ? 'kitchen_basic' : 'counted', conversions: {},
  reminder_frequency_value: null, reminder_frequency_unit: null,
});
const catalog: ProductCatalog = {
  products: [product('Chicken Breast'), product('Salt', true)],
  suggestions: [
    { id: '1', name: ' chicken breast ', aisle: 'meat' },
    { id: '2', name: 'Chicken Wings', aisle: 'meat' },
  ],
};

it('fuzzily searches products and suggestions, suppressing normalized duplicates', () => {
  const result = searchProductCatalog(catalog, 'chiken', 'recipe');
  expect(result.results.map((r) => [r.name, r.type])).toEqual([
    ['Chicken Breast', 'product'], ['Chicken Wings', 'suggestion'],
  ]);
  expect(result.add_available).toBe(true);
});
it('pantry includes only existing tracked products', () => {
  expect(searchProductCatalog(catalog, 'chiken', 'pantry').results.map((r) => r.name)).toEqual(['Chicken Breast']);
  expect(searchProductCatalog(catalog, 'salt', 'pantry')).toEqual({ results: [], add_available: false });
  expect(searchProductCatalog(catalog, 'salt', 'shopping').results[0].name).toBe('Salt');
});
it('exact names block creation but fuzzy matches do not', () => {
  expect(searchProductCatalog(catalog, ' CHICKEN BREAST ', 'recipe').add_available).toBe(false);
  expect(searchProductCatalog(catalog, 'CHICKEN WINGS', 'recipe').add_available).toBe(false);
  expect(searchProductCatalog(catalog, 'chiken', 'recipe').add_available).toBe(true);
});
it('deduplicates before limiting results and prioritizes exact matches', () => {
  const products = Array.from({ length: 15 }, (_, i) => product(`Dragonfruit ${i}`));
  const data: ProductCatalog = { products, suggestions: products.map((p) => ({ ...p })) };
  data.products.push(product('Dragonfruit'));
  const result = searchProductCatalog(data, 'dragonfruit', 'shopping');
  expect(result.results).toHaveLength(10);
  expect(result.results[0].name).toBe('Dragonfruit');
  expect(result.results.every((r) => r.type === 'product')).toBe(true);
});
it('blank searches remain idle', () => {
  expect(searchProductCatalog(catalog, '  ', 'recipe')).toEqual({ results: [], add_available: false });
});
