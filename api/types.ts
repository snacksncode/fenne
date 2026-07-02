import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { parseLocaleFloat } from '@/utils';

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

// Products

export type ProductShape = 'counted' | 'measured' | 'timed' | 'kitchen_basic';

export type ProductDTO = {
  id: string;
  name: string;
  aisle: AisleCategory;
  quantity: number | null;
  unit: Unit;
  pack_count: number | null;
  reminder_frequency_value: number | null;
  reminder_frequency_unit: 'days' | 'weeks' | 'months' | null;
  is_kitchen_basic: boolean;
  shape: ProductShape;
  conversions: Record<string, number>;
};

export type ProductSuggestionDTO = {
  id: string;
  name: string;
  aisle: AisleCategory;
};

export type ProductSearchResultItem =
  | ({ type: 'product' } & ProductDTO)
  | ({ type: 'suggestion' } & ProductSuggestionDTO);

export type ProductDraft = {
  name: string;
  aisle: AisleCategory;
  unit: Unit;
  quantity?: number | null;
  pack_count?: number | null;
  reminder_frequency_value?: number | null;
  reminder_frequency_unit?: 'days' | 'weeks' | 'months' | null;
  is_kitchen_basic?: boolean;
  conversions?: Record<string, number>;
};

export type ProductSearchResult = {
  results: ProductSearchResultItem[];
  add_available: boolean;
};

// Pantry

export type PantryEntryDTO = {
  id: string;
  product_id: string;
  product: ProductDTO;
  quantity_remaining: number;
  last_acquired: string | null;
};

// Consumption

export type ConsumptionDeductionDTO = {
  product_id: string;
  product_name?: string;
  product_shape?: ProductShape;
  product_unit?: Unit;
  requested?: number;
  actually_deducted: number;
};

export type ConsumptionLogDTO = {
  id: string;
  recipe_name: string;
  recipe: { name: string };
  meal_type: MealType;
  schedule_date: string;
  deductions: ConsumptionDeductionDTO[];
};

// Groceries

export type GroceryItemDTO = {
  id: string;
  product: ProductDTO | null;
  name: string;
  quantity: number;
  unit: Unit;
  status: 'pending' | 'completed';
  aisle: AisleCategory;
  source: 'generated' | 'manual';
  recipes: { id: string; name: string }[];
};

export type GroceryItemFormData = Omit<GroceryItemDTO, 'quantity'> & { quantity: string };

export type GroceryItemInput =
  | {
      type: 'custom';
      name: string;
      aisle: AisleCategory;
      quantity: number;
      unit: Unit;
    }
  | {
      type: 'product';
      product_id: string;
      quantity: number;
      unit: Unit;
    };

export const groceryItemToFormData = (item: GroceryItemDTO): GroceryItemFormData => ({
  ...item,
  quantity: item.quantity.toString(),
});

export const groceryItemFromFormData = (form: GroceryItemFormData): GroceryItemDTO => ({
  ...form,
  quantity: parseLocaleFloat(form.quantity),
});

export type GroceryPreviewProductRowDTO = {
  product_id: string;
  product: ProductDTO;
  quantity: number;
  unit: Unit;
  checked: boolean;
  running_low: boolean;
  recipes: { id: string; name: string }[];
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type PreviewRecipeDTO = {
  id: string;
  name: string;
  meal_type: MealType;
  amount: number;
};

export type GroceryPreviewDTO = {
  products: GroceryPreviewProductRowDTO[];
  recipes: PreviewRecipeDTO[];
};

// Ingredients

export type IngredientDTO = {
  id: string;
  product_id: string;
  product: ProductDTO;
  name: string;
  name_override: string | null;
  unit: Unit;
  quantity: number;
  aisle: AisleCategory;
};

export type IngredientFormData = {
  id: string;
  product_id?: string;
  product?: ProductDTO;
  name: string;
  name_override: string | null;
  unit: Unit;
  aisle: AisleCategory;
  quantity: string;
  productDraft?: ProductDraft;
};

export const ingredientToFormData = (ingredient: IngredientDTO): IngredientFormData => ({
  ...ingredient,
  quantity: ingredient.quantity.toString(),
});

export const ingredientFromFormData = (form: IngredientFormData): IngredientDTO => ({
  id: form.id,
  product_id: form.product_id ?? '',
  product: form.product ?? ({
    id: '',
    name: form.productDraft?.name ?? form.name,
    aisle: form.productDraft?.aisle ?? form.aisle,
    quantity: form.productDraft?.quantity ?? null,
    unit: form.productDraft?.unit ?? form.unit,
    pack_count: form.productDraft?.pack_count ?? null,
    reminder_frequency_value: form.productDraft?.reminder_frequency_value ?? null,
    reminder_frequency_unit: form.productDraft?.reminder_frequency_unit ?? null,
    is_kitchen_basic: form.productDraft?.is_kitchen_basic ?? false,
    shape: 'counted',
    conversions: form.productDraft?.conversions ?? {},
  } as ProductDTO),
  name: form.name,
  name_override: form.name_override,
  unit: form.unit,
  aisle: form.aisle,
  quantity: parseLocaleFloat(form.quantity),
});

export type IngredientInput = {
  quantity: number;
  unit: Unit;
  name_override?: string | null;
  product: { id: string } | ProductDraft;
};

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

export type RecipeInputDTO = {
  id?: string;
  name?: string;
  meal_types?: MealType[];
  ingredients?: IngredientInput[];
  time_in_minutes?: number;
  liked?: boolean;
  notes?: string;
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

export const recipeFromFormData = (form: RecipeFormData): RecipeInputDTO => ({
  name: form.name,
  meal_types: form.meal_types,
  ingredients: form.ingredients.map((ingredient) => ({
    quantity: parseLocaleFloat(ingredient.quantity),
    unit: ingredient.unit,
    name_override: ingredient.name_override?.trim() || null,
    product: ingredient.productDraft ?? { id: ingredient.product_id ?? '' },
  })),
  time_in_minutes: parseLocaleFloat(form.time_in_minutes),
  liked: form.liked,
  notes: form.notes,
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
