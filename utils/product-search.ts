import type { ProductCatalog, ProductSearchResult, ProductSearchResultItem } from '@/api/types';
import type { ProductSearchContext } from '@/api/products';
import { createFuzzySearch } from './fuzzy-search';

const normalizeName = (name: string) => name.trim().toLowerCase();

export const createProductCatalogSearch = (catalog: ProductCatalog, context: ProductSearchContext) => {
  const names = new Set(catalog.products.map((product) => normalizeName(product.name)));
  const candidates: ProductSearchResultItem[] = catalog.products
    .filter((product) => context !== 'pantry' || !product.is_kitchen_basic)
    .map((product) => ({ ...product, type: 'product' }));
  if (context !== 'pantry') {
    candidates.push(...catalog.suggestions
      .filter((suggestion) => !names.has(normalizeName(suggestion.name)))
      .map((suggestion) => ({ ...suggestion, type: 'suggestion' as const })));
  }

  const index = createFuzzySearch({ items: candidates, getSearchTerms: (item) => [item.name] });
  const suggestionNames = new Set(catalog.suggestions.map((suggestion) => normalizeName(suggestion.name)));
  return {
    search: (query: string): ProductSearchResult => {
      if (!query.trim()) return { results: [], add_available: false };
      return {
        results: index.search(query).items.slice(0, 10),
        add_available: context !== 'pantry' && !names.has(normalizeName(query)) &&
          !suggestionNames.has(normalizeName(query)),
      };
    },
  };
};

export const searchProductCatalog = (catalog: ProductCatalog, query: string, context: ProductSearchContext) =>
  createProductCatalogSearch(catalog, context).search(query);
