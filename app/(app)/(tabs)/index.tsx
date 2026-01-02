import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopTabBar } from '@/components/TopTabBar';
import { RouteTitle } from '@/components/RouteTitle';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { ScheduleMealSheet, ScheduleMealSheetData } from '@/components/bottomSheets/schedule-meal-sheet';
import { useRef } from 'react';
import { WeeklyScreen } from '@/components/menu/weekly-screen';
import { MonthlyScreen } from '@/components/menu/monthly-screen';
import { SelectDateSheet } from '@/components/bottomSheets/select-date-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Sheets } from '@/components/menu/shared';
import { EditMealSheet, EditMealSheetData } from '@/components/bottomSheets/edit-meal-sheet';
import { EditCalendarDaySheet, EditCalendarDaySheetData } from '@/components/bottomSheets/edit-calendar-day-sheet';
import { CalendarPlus } from 'lucide-react-native';
import { useDeleteScheduleEntry, useUpdateScheduleDay } from '@/api/schedules';
import { SelectRestaurantSheet, SelectRestaurantSheetData } from '@/components/bottomSheets/select-restaurant-sheet';

export type TabParamList = {
  Weekly: undefined;
  Monthly: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

const Index = () => {
  const insets = useSafeAreaInsets();
  const updateScheduleDay = useUpdateScheduleDay();
  const deleteScheduleEntry = useDeleteScheduleEntry();
  const scheduleMealSheetRef = useRef<BottomSheetModal<ScheduleMealSheetData>>(null);
  const selectDateSheetRef = useRef<BottomSheetModal>(null);
  const editMealSheetRef = useRef<BottomSheetModal<EditMealSheetData>>(null);
  const editCalendarDaySheetRef = useRef<BottomSheetModal<EditCalendarDaySheetData>>(null);
  const selectRestaurantSheetRef = useRef<BottomSheetModal<SelectRestaurantSheetData>>(null);
  const sheets: Sheets = {
    scheduleMealSheetRef,
    selectDateSheetRef,
    editMealSheetRef,
    editCalendarDaySheetRef,
  };

  return (
    <Tab.Navigator
      layout={({ children, navigation }) => (
        <View
          style={{
            backgroundColor: '#FEF7EA',
            flex: 1,
          }}
        >
          {children}
          <Button
            variant="primary"
            onPress={() => selectDateSheetRef.current?.present()}
            text="Schedule Meal"
            leftIcon={{ Icon: CalendarPlus }}
            style={{
              position: 'absolute',
              bottom: insets.bottom + 88,
              right: 16,
            }}
          />
          <ScheduleMealSheet
            ref={scheduleMealSheetRef}
            handleSwitchToRestaurant={(params) => {
              selectRestaurantSheetRef.current?.present(params);
            }}
            onMealSelect={({ meal, dateString, mealType }) => {
              updateScheduleDay.mutate({
                dateString,
                ...(mealType === 'breakfast' && { breakfast: { type: 'recipe', recipe_id: meal.id } }),
                ...(mealType === 'lunch' && { lunch: { type: 'recipe', recipe_id: meal.id } }),
                ...(mealType === 'dinner' && { dinner: { type: 'recipe', recipe_id: meal.id } }),
              });
            }}
          />
          <SelectRestaurantSheet
            ref={selectRestaurantSheetRef}
            handleSwitchToRecipes={({ dateString, mealType }) => {
              return scheduleMealSheetRef.current?.present({ dateString, mealType });
            }}
            onRestaurantSelect={({ restaurant, dateString, mealType }) => {
              updateScheduleDay.mutate({
                dateString,
                ...(mealType === 'breakfast' && { breakfast: { type: 'dining_out', name: restaurant } }),
                ...(mealType === 'lunch' && { lunch: { type: 'dining_out', name: restaurant } }),
                ...(mealType === 'dinner' && { dinner: { type: 'dining_out', name: restaurant } }),
              });
            }}
          />
          <SelectDateSheet
            ref={selectDateSheetRef}
            onDaySelect={(params) => {
              selectDateSheetRef.current?.dismiss();
              return scheduleMealSheetRef.current?.present(params);
            }}
          />
          <EditMealSheet
            ref={editMealSheetRef}
            onAmendPlace={(params) => {
              selectRestaurantSheetRef.current?.present(params);
            }}
            onRemove={(params) => {
              editMealSheetRef.current?.dismiss();
              deleteScheduleEntry.mutate(params);
            }}
            onSwapMeal={(params) => {
              scheduleMealSheetRef.current?.present(params);
            }}
          />
          <EditCalendarDaySheet
            ref={editCalendarDaySheetRef}
            navigation={navigation}
            onScheduleMeal={({ dateString, mealType }) => {
              scheduleMealSheetRef.current?.present({ dateString, mealType });
              editCalendarDaySheetRef.current?.dismiss();
            }}
          />
        </View>
      )}
      tabBar={(props) => (
        <RouteTitle
          text="Menu"
          footerSlot={
            <View style={{ marginTop: 12 }}>
              <TopTabBar {...props} />
            </View>
          }
        />
      )}
    >
      <Tab.Screen name="Weekly">{() => <WeeklyScreen sheets={sheets} />}</Tab.Screen>
      <Tab.Screen name="Monthly">{() => <MonthlyScreen sheets={sheets} />}</Tab.Screen>
    </Tab.Navigator>
  );
};

export default Index;
