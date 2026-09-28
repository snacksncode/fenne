import type { ProductCatalog, ProductSearchResult, ProductSearchResultItem } from '@/api/types';
import type { ProductSearchContext } from '@/api/products';
import { fuzzySearch } from './fuzzy-search';

const normalizeName = (name: string) => name.trim().toLowerCase();

export const searchProductCatalog = (
  catalog: ProductCatalog,
  query: string,
  context: ProductSearchContext
): ProductSearchResult => {
  if (!query.trim()) return { results: [], add_available: false };

  const names = new Set(catalog.products.map((product) => normalizeName(product.name)));
  const candidates: ProductSearchResultItem[] = catalog.products
    .filter((product) => context !== 'pantry' || !product.is_kitchen_basic)
    .map((product) => ({ ...product, type: 'product' }));
  if (context !== 'pantry') {
    candidates.push(...catalog.suggestions
      .filter((suggestion) => !names.has(normalizeName(suggestion.name)))
      .map((suggestion) => ({ ...suggestion, type: 'suggestion' as const })));
  }

  return {
    results: fuzzySearch(candidates, query, (item) => item.name).slice(0, 10),
    add_available: context !== 'pantry' && !names.has(normalizeName(query)) &&
      !catalog.suggestions.some((suggestion) => normalizeName(suggestion.name) === normalizeName(query)),
  };
};
