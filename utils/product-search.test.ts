/// <reference types="jest" />
import type { ProductCatalog, ProductDTO } from '@/api/types';
import { createProductCatalogSearch } from './product-search';

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
  const result = createProductCatalogSearch(catalog, 'recipe').search('chiken');
  expect(result.results.map((r) => [r.name, r.type])).toEqual([
    ['Chicken Breast', 'product'], ['Chicken Wings', 'suggestion'],
  ]);
  expect(result.add_available).toBe(true);
});
it('pantry includes only existing tracked products', () => {
  const pantry = createProductCatalogSearch(catalog, 'pantry');
  expect(pantry.search('chiken').results.map((r) => r.name)).toEqual(['Chicken Breast']);
  expect(pantry.search('salt')).toEqual({ results: [], add_available: false });
  expect(createProductCatalogSearch(catalog, 'shopping').search('salt').results[0].name).toBe('Salt');
});
it('exact names block creation but fuzzy matches do not', () => {
  const index = createProductCatalogSearch(catalog, 'recipe');
  expect(index.search(' CHICKEN BREAST ').add_available).toBe(false);
  expect(index.search('CHICKEN WINGS').add_available).toBe(false);
  expect(index.search('chiken').add_available).toBe(true);
});
it('deduplicates before limiting results and prioritizes exact matches', () => {
  const products = Array.from({ length: 15 }, (_, i) => product(`Dragonfruit ${i}`));
  const data: ProductCatalog = { products, suggestions: products.map((p) => ({ ...p })) };
  data.products.push(product('Dragonfruit'));
  const result = createProductCatalogSearch(data, 'shopping').search('dragonfruit');
  expect(result.results).toHaveLength(10);
  expect(result.results[0].name).toBe('Dragonfruit');
  expect(result.results.every((r) => r.type === 'product')).toBe(true);
});
it('blank searches remain idle', () => {
  expect(createProductCatalogSearch(catalog, 'recipe').search('  ')).toEqual({ results: [], add_available: false });
});

it('a prepared catalog keeps context and duplicate-name policy across searches', () => {
  const index = createProductCatalogSearch(catalog, 'recipe');
  expect(index.search('chiken')).toEqual({
    results: [{ ...catalog.products[0], type: 'product' }, { ...catalog.suggestions[1], type: 'suggestion' }],
    add_available: true,
  });
  expect(index.search('CHICKEN WINGS').add_available).toBe(false);
  expect(index.search('')).toEqual({ results: [], add_available: false });
});
