import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { RecipeInputDTO, RecipeDTO } from '@/api/types';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isDefined, pickBy } from 'remeda';
import { queryKeys } from '@/api/query-keys';

const refreshRecipes = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'recipes' });

export const recipesRequests = {
  getAll: () => {
    return client.get<RecipeDTO[]>('/recipes');
  },
  get: (id: string) => {
    return client.get<RecipeDTO>(`/recipes/${id}`);
  },
  add: (recipe: RecipeInputDTO) => {
    return client.post<RecipeDTO>('/recipes', recipe);
  },
  edit: (recipe: RecipeInputDTO & { id: string }) => {
    const { id, ...recipeData } = recipe;
    return client.patch<RecipeDTO>(`/recipes/${id}`, pickBy(recipeData, isDefined));
  },
  delete: (data: { id: string }) => {
    return client.delete(`/recipes/${data.id}`);
  },
};

export const recipesQuery = queryOptions({
  queryKey: queryKeys.recipes.all(),
  queryFn: recipesRequests.getAll,
  staleTime: Infinity,
});

export const recipeQuery = (id: string) => {
  return queryOptions({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => recipesRequests.get(id),
    staleTime: Infinity,
  });
};

export const useRecipes = () => {
  return useQuery(recipesQuery);
};

export const useRecipe = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  return useQuery({
    ...recipeQuery(id),
    initialData: () => queryClient.getQueryState(recipesQuery.queryKey)?.isInvalidated
      ? undefined
      : queryClient.getQueryData(recipesQuery.queryKey)?.find((recipe) => recipe.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(recipesQuery.queryKey)?.dataUpdatedAt,
  });
};

export const addRecipeMutation = {
  meta: { persist: true },
  mutationKey: ['addRecipe'],
  mutationFn: recipesRequests.add,
  onSettled: refreshRecipes,
};

queryClient.setMutationDefaults(addRecipeMutation.mutationKey, addRecipeMutation);

export const useAddRecipe = () => useMutation(addRecipeMutation);

export const editRecipeMutation = {
  meta: { persist: true },
  mutationKey: ['editRecipe'],
  mutationFn: recipesRequests.edit,
  onSettled: refreshRecipes,
};

queryClient.setMutationDefaults(editRecipeMutation.mutationKey, editRecipeMutation);

export const useEditRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...editRecipeMutation,
    onSuccess: (recipe) => {
      queryClient.setQueryData(recipeQuery(recipe.id).queryKey, recipe);
      queryClient.setQueryData(recipesQuery.queryKey, (recipes) => recipes?.map((existing) => existing.id === recipe.id ? recipe : existing));
    },
  });
};

export const deleteRecipeMutation = {
  meta: { persist: true },
  mutationKey: ['deleteRecipe'],
  mutationFn: recipesRequests.delete,
  onSettled: refreshRecipes,
};

queryClient.setMutationDefaults(deleteRecipeMutation.mutationKey, deleteRecipeMutation);

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...deleteRecipeMutation,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries(recipesQuery);
      const query = queryClient.getQueryCache().find({ queryKey: recipesQuery.queryKey, exact: true });
      const removed = queryClient.getQueryData(recipesQuery.queryKey)?.find((recipe) => recipe.id === id);
      queryClient.setQueryData(recipesQuery.queryKey, (recipes) => recipes?.filter((recipe) => recipe.id !== id));
      return { removed, query };
    },
    onError: (_error, _variables, context) => {
      if (!context?.removed || queryClient.getQueryCache().find({ queryKey: recipesQuery.queryKey, exact: true }) !== context.query) return;
      const removed = context.removed;
      queryClient.setQueryData(recipesQuery.queryKey, (recipes) => recipes && !recipes.some(({ id }) => id === removed.id) ? [...recipes, removed] : recipes);
    },
  });
};
