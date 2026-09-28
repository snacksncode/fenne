import { api } from '@/api';
import { RecipeDTO } from '@/api/types';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate } from '@/api/optimistic';
import { isDefined, pickBy } from 'remeda';
import { queryClient } from '@/query-client';
import { queryKeys } from '@/api/query-keys';

export const recipesOptions = queryOptions({
  queryKey: queryKeys.recipes.all(),
  queryFn: api.recipes.getAll,
  staleTime: Infinity,
});

export const recipeOptions = (id: string) => {
  return queryOptions({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => api.recipes.get(id),
    staleTime: Infinity,
  });
};

export const useRecipes = () => {
  return useQuery(recipesOptions);
};

export const useRecipe = ({ id }: { id: string }) => {
  const recipes = useRecipes();

  return useQuery({
    ...recipeOptions(id),
    initialData: recipes.data?.find((recipe) => recipe.id === id),
  });
};

queryClient.setMutationDefaults(['addRecipe'], { mutationFn: api.recipes.add });
export const useAddRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addRecipe'],
    mutationFn: api.recipes.add,
    onSettled: () => Promise.all([
      queryClient.invalidateQueries(recipesOptions),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
    ]),
  });
};

queryClient.setMutationDefaults(['editRecipe'], { mutationFn: api.recipes.edit });
export const useEditRecipe = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editRecipe'],
    mutationFn: api.recipes.edit,
    onMutate: async (newRecipeData) => {
      const optimisticUpdateRecipe = (recipe: RecipeDTO) => {
        const { ingredients: _ingredients, ...scalarRecipeData } = newRecipeData;
        Object.assign(recipe, pickBy(scalarRecipeData, isDefined));
      };

      const recipesContext = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (draft) => {
          const recipe = draft.find((r) => r.id === newRecipeData.id);
          if (recipe) optimisticUpdateRecipe(recipe);
        },
      });

      const existingRecipeData = queryClient.getQueryData(recipeOptions(newRecipeData.id).queryKey);
      let recipeContext;
      if (existingRecipeData) {
        recipeContext = await update({
          queryKey: recipeOptions(newRecipeData.id).queryKey,
          updateFn: (draft) => optimisticUpdateRecipe(draft),
        });
      }

      return {
        recipesContext: { queryKey: recipesOptions.queryKey, previousData: recipesContext.previousData },
        ...(recipeContext && {
          recipeContext: {
            queryKey: recipeOptions(newRecipeData.id).queryKey,
            previousData: recipeContext.previousData,
          },
        }),
      };
    },
    onError: (_err, _vars, context) => {
      if (context?.recipeContext) revert(context.recipeContext);
      if (context?.recipesContext) revert(context.recipesContext);
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries(recipesOptions),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
    ]),
  });
};

queryClient.setMutationDefaults(['deleteRecipe'], { mutationFn: api.recipes.delete });
export const useDeleteRecipe = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteRecipe'],
    mutationFn: api.recipes.delete,
    onMutate: async ({ id }) => {
      const { previousData } = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (state) => state.filter((r) => r.id !== id),
      });
      return { previousData, queryKey: recipesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};
