import { SheetDefinition, SheetRegister } from 'react-native-actions-sheet';

import { AisleCategory, GroceryItemDTO } from '@/api/groceries';
import { IngredientFormData, MealType, MealEntryDTO } from '@/api/schedules';
import { RecipeDTO } from '@/api/recipes';
import { TabParamList } from '@/app/(app)/(tabs)';

import { SelectUnitSheet, Unit } from '@/components/bottomSheets/select-unit-sheet';
import { SelectCategorySheet } from '@/components/bottomSheets/select-category-sheet';
import { EditIngredientSheet } from '@/components/bottomSheets/edit-ingredient-sheet';
import { GroceryItemSheet } from '@/components/bottomSheets/grocery-item-sheet';
import { ScheduleMealSheet } from '@/components/bottomSheets/schedule-meal-sheet';
import { RecipeOptionsSheet } from '@/components/bottomSheets/recipe-options-sheet';
import { LeaveFamilySheet } from '@/components/bottomSheets/leave-family-sheet';
import { ChangePasswordSheet } from '@/components/bottomSheets/change-password-sheet';
import { ChangeDetailsSheet } from '@/components/bottomSheets/change-details-sheet';
import { EditCalendarDaySheet } from '@/components/bottomSheets/edit-calendar-day-sheet';
import { EditMealSheet } from '@/components/bottomSheets/edit-meal-sheet';
import { InviteFamilyMemberSheet } from '@/components/bottomSheets/invite-family-member-sheet';
import { SelectDateSheet } from '@/components/bottomSheets/select-date-sheet';
import { SelectDateRangeSheet } from '@/components/bottomSheets/select-date-range-sheet';
import { TutorialSheet } from '@/components/bottomSheets/tutorial-sheet';
import { ConvertGuestSheet } from '@/components/bottomSheets/convert-guest-sheet';
import { LinkInputSheet } from '@/components/bottomSheets/link-input-sheet';
import { DeleteAccountSheet } from '@/components/bottomSheets/delete-account-sheet';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'select-unit-sheet': SheetDefinition<{
      payload: { unit: Unit };
      returnValue: Unit | undefined;
    }>;
    'select-category-sheet': SheetDefinition<{
      returnValue: AisleCategory | undefined;
    }>;
    'edit-ingredient-sheet': SheetDefinition<{
      payload: { ingredient?: IngredientFormData };
      returnValue: IngredientFormData | undefined;
    }>;
    'grocery-item-sheet': SheetDefinition<{
      payload: { grocery?: GroceryItemDTO };
    }>;
    'schedule-meal-sheet': SheetDefinition<{
      payload:
        | { type: 'meal'; dateString: string; mealType?: MealType }
        | { type: 'restaurant'; dateString: string; defaultMealType?: MealType; defaultRestaurant?: string };
    }>;
    'recipe-options-sheet': SheetDefinition<{
      payload: { recipe: RecipeDTO };
    }>;
    'leave-family-sheet': SheetDefinition;
    'change-password-sheet': SheetDefinition;
    'change-details-sheet': SheetDefinition;
    'convert-guest-sheet': SheetDefinition;
    'edit-calendar-day-sheet': SheetDefinition<{
      payload: {
        dateString: string;
        navigation: BottomTabNavigationProp<TabParamList>;
      };
    }>;
    'edit-meal-sheet': SheetDefinition<{
      payload: {
        data: MealEntryDTO & { mealType: MealType; dateString: string };
      };
    }>;
    'invite-family-member-sheet': SheetDefinition;
    'select-date-sheet': SheetDefinition<{
      payload: undefined;
    }>;
    'select-date-range-sheet': SheetDefinition;

    'tutorial-sheet': SheetDefinition;
    'link-input-sheet': SheetDefinition<{
      payload: { selectedText?: string; existingUrl?: string };
      returnValue: string | undefined;
    }>;
    'delete-account-sheet': SheetDefinition<{
      payload: { variant?: 'account' | 'guest' };
      returnValue: boolean | undefined;
    }>;
  }
}

export const Sheets = () => (
  <SheetRegister
    sheets={{
      'select-unit-sheet': SelectUnitSheet,
      'select-category-sheet': SelectCategorySheet,
      'edit-ingredient-sheet': EditIngredientSheet,
      'grocery-item-sheet': GroceryItemSheet,
      'schedule-meal-sheet': ScheduleMealSheet,
      'recipe-options-sheet': RecipeOptionsSheet,
      'leave-family-sheet': LeaveFamilySheet,
      'change-password-sheet': ChangePasswordSheet,
      'change-details-sheet': ChangeDetailsSheet,
      'convert-guest-sheet': ConvertGuestSheet,
      'edit-calendar-day-sheet': EditCalendarDaySheet,
      'edit-meal-sheet': EditMealSheet,
      'invite-family-member-sheet': InviteFamilyMemberSheet,
      'select-date-sheet': SelectDateSheet,
      'select-date-range-sheet': SelectDateRangeSheet,
      'tutorial-sheet': TutorialSheet,
      'link-input-sheet': LinkInputSheet,
      'delete-account-sheet': DeleteAccountSheet,
    }}
  />
);
