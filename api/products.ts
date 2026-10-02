import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { ProductCatalog, ProductDTO, ProductDraft, ProductUsagesDTO, PurchaseSuggestionDTO } from '@/api/types';
import { useMemo } from 'react';
import { useCurrentUser } from '@/api/auth';
import { createProductCatalogSearch } from '@/utils/product-search';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';

const refreshProducts = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'products' });

export const productsRequests = {
  purchaseSuggestion: (id: string, needed: number, pantry: number) => {
    const params = new URLSearchParams({ needed: String(needed), pantry: String(pantry) });
    return client.get<PurchaseSuggestionDTO>(`/products/${id}/purchase_suggestion?${params}`);
  },
  getAll: () => {
    return client.get<ProductDTO[]>('/products');
  },
  edit: (data: Pick<ProductDTO, 'id'> & Partial<ProductDraft> & { impact_acknowledged?: boolean }) => {
    const { id, ...productData } = data;
    return client.patch<ProductDTO>(`/products/${id}`, productData);
  },
  usages: (id: string) => {
    return client.get<ProductUsagesDTO>(`/products/${id}/usages`);
  },
  delete: (data: { id: string }) => {
    return client.delete(`/products/${data.id}`);
  },
  catalog: () => client.get<ProductCatalog>('/product_catalog'),
};

export type ProductSearchContext = 'recipe' | 'shopping' | 'pantry';

export const productsQuery = queryOptions({
  queryKey: queryKeys.products.all(),
  queryFn: productsRequests.getAll,
  staleTime: Infinity,
});

export const useProducts = () => {
  return useQuery(productsQuery);
};

export const purchaseSuggestionQuery = (id: string, needed: number, pantry: number) => queryOptions({
  queryKey: [...queryKeys.products.all(), id, 'purchase-suggestion', needed, pantry],
  queryFn: () => productsRequests.purchaseSuggestion(id, needed, pantry),
});

export const editProductMutation = {
  meta: { persist: true },
  mutationKey: ['editProduct'],
  mutationFn: productsRequests.edit,
  onSettled: refreshProducts,
};

queryClient.setMutationDefaults(editProductMutation.mutationKey, editProductMutation);

export const useEditProduct = () => useMutation(editProductMutation);

export const useProductUsages = (id: string, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.products.all(), id, 'usages'],
    queryFn: () => productsRequests.usages(id),
    enabled,
  });
};

export const deleteProductMutation = {
  meta: { persist: true },
  mutationKey: ['deleteProduct'],
  mutationFn: productsRequests.delete,
  onSettled: refreshProducts,
};

queryClient.setMutationDefaults(deleteProductMutation.mutationKey, deleteProductMutation);

export const useDeleteProduct = () => useMutation(deleteProductMutation);

export const productCatalogQuery = (familyId: string) => queryOptions({
  queryKey: queryKeys.products.catalog(familyId),
  queryFn: productsRequests.catalog,
  staleTime: Infinity,
  enabled: familyId.length > 0,
});

export const useProductSuggestions = (query: string, context: ProductSearchContext) => {
  const { data: user } = useCurrentUser();
  const catalog = useQuery(productCatalogQuery(user?.family.id ?? ''));
  const search = useMemo(
    () => catalog.data ? createProductCatalogSearch(catalog.data, context) : undefined,
    [catalog.data, context]
  );
  const data = useMemo(() => search?.search(query), [search, query]);
  return { ...catalog, data };
};
