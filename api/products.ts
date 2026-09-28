import { useMemo } from 'react';
import { useCurrentUser } from '@/api/auth';
import { searchProductCatalog } from '@/utils/product-search';
import { api } from '@/api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { pantryOptions } from '@/api/pantry';
import { groceriesOptions } from '@/api/groceries';

export type ProductSearchContext = 'recipe' | 'shopping' | 'pantry';

export const productsOptions = queryOptions({
  queryKey: queryKeys.products.all(),
  queryFn: api.products.getAll,
  staleTime: Infinity,
});

export const useProducts = () => {
  return useQuery(productsOptions);
};

export const purchaseSuggestionOptions = (id: string, needed: number, pantry: number) => queryOptions({
  queryKey: [...queryKeys.products.all(), id, 'purchase-suggestion', needed, pantry],
  queryFn: () => api.products.purchaseSuggestion(id, needed, pantry),
});

export const useEditProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['editProduct'],
    mutationFn: api.products.edit,
    onSettled: () => {
      queryClient.invalidateQueries(productsOptions);
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries(groceriesOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all() });
    },
  });
};

export const useProductUsages = (id: string, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.products.all(), id, 'usages'],
    queryFn: () => api.products.usages(id),
    enabled,
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteProduct'],
    mutationFn: api.products.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(productsOptions);
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries(groceriesOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

export const productCatalogOptions = (familyId: string) => queryOptions({
  queryKey: queryKeys.products.catalog(familyId),
  queryFn: api.products.catalog,
  staleTime: Infinity,
  enabled: familyId.length > 0,
});

export const useProductSuggestions = (query: string, context: ProductSearchContext) => {
  const { data: user } = useCurrentUser();
  const catalog = useQuery(productCatalogOptions(user?.family.id ?? ''));
  const data = useMemo(
    () => catalog.data ? searchProductCatalog(catalog.data, query, context) : undefined,
    [catalog.data, query, context]
  );
  return { ...catalog, data };
};
