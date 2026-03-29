import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { parseLocaleFloat } from '@/utils';

// Groceries

export type AisleCategory =
  | 'produce'
  | 'bakery'
  | 'dairy_eggs'
  | 'meat'
  | 'seafood'
  | 'pantry'
  | 'frozen_foods'
  | 'beverages'
  | 'snacks'
  | 'condiments_sauces'
  | 'spices_baking'
  | 'household'
  | 'personal_care'
  | 'pet_supplies'
  | 'other';

export type GroceryItemDTO = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  status: 'pending' | 'completed';
  aisle: AisleCategory;
};

export type GroceryItemFormData = Omit<GroceryItemDTO, 'quantity'> & { quantity: string };

export const groceryItemToFormData = (item: GroceryItemDTO): GroceryItemFormData => ({
  ...item,
  quantity: item.quantity.toString(),
});

export const groceryItemFromFormData = (form: GroceryItemFormData): GroceryItemDTO => ({
  ...form,
  quantity: parseLocaleFloat(form.quantity),
});

export type PreviewIngredientDTO = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type PreviewRecipeDTO = {
  id: string;
  name: string;
  meal_type: MealType;
  amount: number;
  ingredients: PreviewIngredientDTO[];
};

// Ingredients

export type IngredientDTO = {
  id: string;
  name: string;
  unit: Unit;
  quantity: number;
  aisle: AisleCategory;
};

export type IngredientFormData = Omit<IngredientDTO, 'quantity'> & {
  quantity: string;
};

export const ingredientToFormData = (ingredient: IngredientDTO): IngredientFormData => ({
  ...ingredient,
  quantity: ingredient.quantity.toString(),
});

export const ingredientFromFormData = (form: IngredientFormData): IngredientDTO => ({
  ...form,
  quantity: parseLocaleFloat(form.quantity),
});

// Recipes

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

// Schedules

export type MealEntryDTO =
  | { id: string; type: 'recipe'; recipe: RecipeDTO }
  | { id: string; type: 'dining_out'; name: string };

export type ScheduleDayDTO = {
  date: string;
  breakfast: MealEntryDTO | null;
  lunch: MealEntryDTO | null;
  dinner: MealEntryDTO | null;
  is_shopping_day: boolean;
};

export type ScheduleMealEntry = { type: 'recipe'; recipe_id: string } | { type: 'dining_out'; name: string };

export type ScheduleDayInput = {
  dateString: string;
  breakfast?: ScheduleMealEntry | null;
  lunch?: ScheduleMealEntry | null;
  dinner?: ScheduleMealEntry | null;
  is_shopping_day?: boolean;
};
