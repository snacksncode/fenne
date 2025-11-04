import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopTabBar } from '@/components/TopTabBar';
import { RouteTitle } from '@/components/RouteTitle';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { Plus } from '@/components/svgs/plus';
import { ScheduleMealSheet, ScheduleMealSheetData } from '@/components/bottomSheets/schedule-meal-sheet';
import { useRef } from 'react';
import { WeeklyScreen } from '@/components/menu/weekly-screen';
import { MonthlyScreen } from '@/components/menu/monthly-screen';
import { SelectDateSheet } from '@/components/bottomSheets/select-date-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Sheets } from '@/components/menu/shared';
import { EditMealSheet, EditMealSheetData } from '@/components/bottomSheets/edit-meal-sheet';

export type TabParamList = {
  Weekly: undefined;
  Monthly: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

const Index = () => {
  const insets = useSafeAreaInsets();
  const scheduleMealSheetRef = useRef<BottomSheetModal<ScheduleMealSheetData>>(null);
  const selectDateSheetRef = useRef<BottomSheetModal>(null);
  const editMealSheetRef = useRef<BottomSheetModal<EditMealSheetData>>(null);
  const sheets: Sheets = { scheduleMealSheetRef, selectDateSheetRef, editMealSheetRef };

  return (
    <View
      style={{
        backgroundColor: '#FEF7EA',
        flex: 1,
      }}
    >
      <Tab.Navigator
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
      <Button
        variant="primary"
        onPress={() => selectDateSheetRef.current?.present()}
        text="Schedule Meal"
        leftIcon={{ Icon: Plus }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          right: 16,
          width: 172,
        }}
      />
      <ScheduleMealSheet
        ref={scheduleMealSheetRef}
        onMealSelect={(meal) => {
          scheduleMealSheetRef.current?.dismiss();
          alert('Selected: ' + meal.name);
        }}
      />
      <SelectDateSheet
        ref={selectDateSheetRef}
        onDaySelect={({ dateString }) => {
          selectDateSheetRef.current?.dismiss();
          return scheduleMealSheetRef.current?.present({ dateString });
        }}
      />
      <EditMealSheet ref={editMealSheetRef} />
    </View>
  );
};

export default Index;
