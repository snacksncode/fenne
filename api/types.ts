import { Unit } from '@/lib/quantity';
import { parseLocaleFloat } from '@/lib/quantity';

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
  unit: Unit;
  reminder_frequency_value: number | null;
  reminder_frequency_unit: 'days' | 'weeks' | 'months' | null;
  is_kitchen_basic: boolean;
  shape: ProductShape;
  conversions: Record<string, number>;
  pack_sizes?: number[];
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
  reminder_frequency_value?: number | null;
  reminder_frequency_unit?: 'days' | 'weeks' | 'months' | null;
  is_kitchen_basic?: boolean;
  conversions?: Record<string, number>;
  pack_sizes?: number[];
};

export type ProductCatalog = {
  products: ProductDTO[];
  suggestions: ProductSuggestionDTO[];
};

export type ProductSearchResult = {
  results: ProductSearchResultItem[];
  add_available: boolean;
};

export type ProductUsagesDTO = {
  recipes: RecipeDTO[];
};

export type ProductDeleteBlockersDTO = ProductUsagesDTO & {
  base: string[];
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

export type PurchaseSuggestionDTO = {
  needed: number;
  pantry: number;
  shortage: number;
  suggested_quantity: number;
  packs: { size: number; count: number }[];
};

export type GroceryItemDTO = {
  id: string;
  product: ProductDTO | null;
  name: string;
  quantity: number;
  unit: Unit;
  status: 'pending' | 'completed';
  aisle: AisleCategory;
  source: 'generated' | 'manual';
  purchase?: PurchaseSuggestionDTO | null;
  quantity_overridden?: boolean;
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

export type GroceryPreviewProductRowDTO = {
  product_id: string;
  product: ProductDTO;
  quantity: number;
  unit: Unit;
  checked: boolean;
  running_low: boolean;
  purchase?: PurchaseSuggestionDTO | null;
  quantity_overridden?: boolean;
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

export type IngredientProductSelection =
  | { type: 'existing'; product: ProductDTO }
  | { type: 'draft'; product: ProductDraft };

export type IngredientFormData = {
  id: string;
  selectedProduct: IngredientProductSelection;
  name: string;
  name_override: string | null;
  unit: Unit;
  aisle: AisleCategory;
  quantity: string;
};

export type IngredientInput = {
  quantity: number;
  unit: Unit;
  name_override?: string | null;
  product: { id: string } | ProductDraft;
};

export type MissingRecipeConversionDTO = {
  ingredient_index: number;
  product_id: string | null;
  product_name: string;
  ingredient_unit: Unit;
  product_unit: Unit;
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

// Schedules

export type MealEntryDTO =
  | { id: string; type: 'recipe'; recipe: RecipeDTO }
  | { id: string; type: 'dining_out'; name: string };

export type ScheduleDayDTO = {
  date: string;
  breakfast: MealEntryDTO | null;
  lunch: MealEntryDTO | null;
  dinner: MealEntryDTO | null;
};

export type ScheduleMealEntry = { type: 'recipe'; recipe_id: string } | { type: 'dining_out'; name: string };

export type ScheduleDayInput = {
  dateString: string;
  breakfast?: ScheduleMealEntry | null;
  lunch?: ScheduleMealEntry | null;
  dinner?: ScheduleMealEntry | null;
};
