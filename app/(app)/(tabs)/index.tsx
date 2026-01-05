import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopTabBar } from '@/components/TopTabBar';
import { RouteTitle } from '@/components/RouteTitle';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { SheetManager } from 'react-native-actions-sheet';
import { WeeklyScreen } from '@/components/menu/weekly-screen';
import { MonthlyScreen } from '@/components/menu/monthly-screen';
import { CalendarPlus } from 'lucide-react-native';
import { EditMealSheetData } from '@/components/bottomSheets/edit-meal-sheet';
import { NavigationHelpers } from '@react-navigation/native';

export type TabParamList = {
  Weekly: undefined;
  Monthly: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

const Index = () => {
  const insets = useSafeAreaInsets();

  const showSelectDateSheet = () => {
    SheetManager.show('select-date-sheet');
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
            onPress={showSelectDateSheet}
            text="Schedule Meal"
            leftIcon={{ Icon: CalendarPlus }}
            style={{
              position: 'absolute',
              bottom: insets.bottom + 88,
              right: 16,
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
      <Tab.Screen name="Weekly">
        {() => <WeeklyScreen />}
      </Tab.Screen>
      <Tab.Screen name="Monthly">
        {() => <MonthlyScreen showEditCalendarDaySheet={(dateString, navigation) => {
          SheetManager.show('edit-calendar-day-sheet', {
            payload: { dateString, navigation: navigation as any },
          });
        }} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default Index;
