import { api } from '@/api';
import { ProductSearchResult } from '@/api/types';
import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      queryClient.invalidateQueries({ queryKey: queryKeys.products.suggestions.all() });
    },
  });
};

export const productSuggestionsOptions = (query: string, context: ProductSearchContext) =>
  queryOptions<ProductSearchResult>({
    queryKey: queryKeys.products.suggestions.search(context, query),
    queryFn: () => api.products.suggestions(query, context),
    enabled: query.trim().length > 0,
    placeholderData: query.trim().length > 0 ? keepPreviousData : undefined,
    gcTime: 0,
  });

export const useProductSuggestions = (query: string, context: ProductSearchContext) => {
  return useQuery(productSuggestionsOptions(query, context));
};
