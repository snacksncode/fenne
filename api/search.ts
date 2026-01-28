import { api } from '@/api';
import { AisleCategory } from '@/api/groceries';
import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type IngredientOption = {
  id: string;
  name: string;
  aisle: AisleCategory;
  custom: boolean;
};

export const searchOptions = (query: string) => {
  return queryOptions({
    queryKey: ['search', query] as const,
    queryFn: () => api.search.byQuery(query),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });
};

export const useIngredientSearch = (query: string) => {
  return useQuery(searchOptions(query));
};

export const useDeleteCustomIngredient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteCustomIngredient'],
    mutationFn: (id: string) => api.search.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};
