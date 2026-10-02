import { missingRecipeConversionsFromError } from '@/api/errors';
import { useAddRecipe, useEditRecipe } from '@/api/recipes';
import { tempId } from '@/api/optimistic';
import { IngredientFormData, MealType, RecipeDTO, RecipeFormData, RecipeInputDTO } from '@/api/types';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/lib/quantity';
import { useNavigation } from 'expo-router/react-navigation';
import { useRef } from 'react';
import { Keyboard } from 'react-native';
import { EnrichedTextInputInstance } from 'react-native-enriched-html';
import { z } from 'zod';

const recipeToFormData = (recipe: RecipeDTO): RecipeFormData => ({
  ...recipe,
  ingredients: recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    selectedProduct: { type: 'existing' as const, product: ingredient.product },
    quantity: ingredient.quantity.toString(),
  })),
  time_in_minutes: recipe.time_in_minutes.toString(),
});

const recipeFromFormData = (form: RecipeFormData): RecipeInputDTO => ({
  name: form.name,
  meal_types: form.meal_types,
  ingredients: form.ingredients.map((ingredient) => ({
    quantity: parseLocaleFloat(ingredient.quantity),
    unit: ingredient.unit,
    name_override: ingredient.name_override?.trim() || null,
    product:
      ingredient.selectedProduct.type === 'existing'
        ? { id: ingredient.selectedProduct.product.id }
        : ingredient.selectedProduct.product,
  })),
  time_in_minutes: parseLocaleFloat(form.time_in_minutes),
  liked: form.liked,
  notes: form.notes,
});

const fields = ['name', 'time_in_minutes', 'meal_types', 'ingredients', 'notes'] as const;
const recipeSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name is required'),
  ingredients: z.custom<IngredientFormData[]>()
    .refine((ingredients) => ingredients.length > 0, 'Add at least one ingredient')
    .refine((ingredients) => ingredients.every((ingredient) => {
      const quantity = parseLocaleFloat(ingredient.quantity);
      return Number.isFinite(quantity) && quantity > 0 && ingredient.selectedProduct.product.name.trim().length > 0;
    }), 'Every ingredient needs a shopping item and quantity'),
  liked: z.boolean(),
  meal_types: z.custom<MealType[]>().refine((types) => types.length > 0, 'Pick at least one meal type'),
  notes: z.string(),
  time_in_minutes: z.string().refine((value) => {
    const minutes = parseLocaleFloat(value);
    return Number.isFinite(minutes) && minutes > 0;
  }, 'Cooking time is required'),
});

/** Owns the Recipe draft and bounded, user-driven Conversion recovery. */
export const useRecipeEditor = (recipe?: RecipeDTO) => {
  const navigation = useNavigation();
  const sheets = useSheets();
  const addRecipe = useAddRecipe();
  const editRecipe = useEditRecipe();
  const notesRef = useRef<EnrichedTextInputInstance>(null);
  const feedback = useFormFeedback(fields);
  const initialDraft = useRef<RecipeFormData | null>(null);
  if (!initialDraft.current) {
    initialDraft.current = recipe ? recipeToFormData(recipe) : {
      id: tempId(), name: '', ingredients: [], liked: false, meal_types: [], notes: '', time_in_minutes: '',
    };
  }

  const form = useAppForm({
    defaultValues: initialDraft.current,
    validators: { onSubmit: recipeSchema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      Keyboard.dismiss();
      try {
        const notes = ((await notesRef.current?.getHTML()) ?? value.notes)
          .replaceAll(/<h[456]>/g, '<p>').replaceAll(/<\/h[456]>/g, '</p>');
        let ingredients = value.ingredients;
        const maximumSaveAttempts = 4;
        for (let attempt = 0; attempt < maximumSaveAttempts; attempt += 1) {
          try {
            const data = recipeFromFormData({ ...value, ingredients, notes });
            if (recipe) await editRecipe.mutateAsync({ ...data, id: recipe.id });
            else await addRecipe.mutateAsync(data);
            navigation.goBack();
            return;
          } catch (error) {
            const requirements = missingRecipeConversionsFromError(error);
            if (!requirements?.length) throw error;
            if (attempt === maximumSaveAttempts - 1) {
              feedback.setError('Could not resolve every shopping item conversion');
              return;
            }
            const resolved = new Set<string>();
            for (const requirement of requirements) {
              const key = `${requirement.product_id ?? `ingredient:${requirement.ingredient_index}`}:${requirement.ingredient_unit}`;
              if (resolved.has(key)) continue;
              resolved.add(key);
              const ingredient = ingredients[requirement.ingredient_index];
              const updated = ingredient && await sheets.present('edit-ingredient-sheet', { data: { ingredient } });
              if (!updated) {
                feedback.setError('Recipe not saved. Resolve the missing shopping item conversions to continue.');
                return;
              }
              ingredients = ingredients.map((current, index) => {
                if (index === requirement.ingredient_index) return updated;
                if (updated.selectedProduct.type === 'existing' && current.selectedProduct.type === 'existing'
                  && current.selectedProduct.product.id === updated.selectedProduct.product.id) {
                  return { ...current, selectedProduct: updated.selectedProduct };
                }
                return current;
              });
              // Keep completed repairs even if the next Conversion is cancelled.
              formApi.setFieldValue('ingredients', ingredients);
            }
          }
        }
      } catch (error) {
        feedback.reportError(formApi, error, 'Could not save recipe');
      }
    },
  });

  const editIngredient = async (ingredient?: IngredientFormData) => {
    Keyboard.dismiss();
    notesRef.current?.blur();
    const updated = await sheets.present('edit-ingredient-sheet', { data: { ingredient } });
    if (!updated) return;
    feedback.clearServerErrors(form);
    const current = form.state.values.ingredients;
    form.setFieldValue('ingredients', current.some((item) => item.id === updated.id)
      ? current.map((item) => item.id === updated.id ? updated : item) : [...current, updated]);
  };

  const removeIngredient = (ingredient: IngredientFormData) => {
    feedback.clearServerErrors(form);
    form.setFieldValue('ingredients', form.state.values.ingredients.filter((item) => item.id !== ingredient.id));
  };

  return { form, feedback, notesRef, editIngredient, removeIngredient };
};
