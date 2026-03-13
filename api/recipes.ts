import { api } from '@/api';
import { MealType, IngredientDTO, IngredientFormData, ingredientToFormData, ingredientFromFormData } from '@/api/schedules';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate } from '@/api/optimistic';
import { isDefined, pickBy } from 'remeda';
import { queryClient } from '@/query-client';
import { parseLocaleFloat } from '@/utils';

export type RecipeDTO = {
  id: string;
  name: string;
  meal_types: MealType[];
  ingredients: IngredientDTO[];
  time_in_minutes: number;
  liked: boolean;
  notes: string;
};

export type RecipeFormData = Omit<RecipeDTO, 'ingredients' | 'time_in_minutes'> & {
  ingredients: IngredientFormData[];
  time_in_minutes: string;
};

export const recipeToFormData = (recipe: RecipeDTO): RecipeFormData => ({
  ...recipe,
  ingredients: recipe.ingredients.map(ingredientToFormData),
  time_in_minutes: recipe.time_in_minutes.toString(),
});

export const recipeFromFormData = (form: RecipeFormData): RecipeDTO => ({
  ...form,
  ingredients: form.ingredients.map(ingredientFromFormData),
  time_in_minutes: parseLocaleFloat(form.time_in_minutes),
});

export const recipesOptions = queryOptions({
  queryKey: ['recipes'] as const,
  queryFn: api.recipes.getAll,
  staleTime: Infinity,
});

export const recipeOptions = (id: string) => {
  return queryOptions({
    queryKey: ['recipes', id] as const,
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
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addRecipe'],
    mutationFn: api.recipes.add,
    onMutate: async (newRecipeData) => {
      const { previousData } = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (state) => {
          state.push(newRecipeData);
        },
      });

      return { previousData, queryKey: recipesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
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
        Object.assign(recipe, pickBy(recipe, isDefined));
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
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
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
