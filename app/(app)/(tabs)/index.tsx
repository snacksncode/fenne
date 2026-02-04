import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopTabBar } from '@/components/TopTabBar';
import { RouteTitle } from '@/components/RouteTitle';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { SheetManager } from 'react-native-actions-sheet';
import { hasWeeklyScreenLoadedAtom, WeeklyScreen } from '@/components/menu/weekly-screen';
import { MonthlyScreen } from '@/components/menu/monthly-screen';
import { CalendarPlus } from 'lucide-react-native';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';

export type TabParamList = {
  Weekly: undefined;
  Monthly: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

const usePopupTutorialSheet = () => {
  const hasWeeklyScreenLoaded = useAtomValue(hasWeeklyScreenLoadedAtom);
  const { isGuest, isComplete } = useTutorialProgress();
  const preComplete = useRef(false);
  const postComplete = useRef(false);

  useEffect(() => {
    if (!hasWeeklyScreenLoaded || !isGuest) return;
    if (!isComplete && !preComplete.current) {
      preComplete.current = true;
      SheetManager.show('tutorial-sheet');
    }
    if (isComplete && !postComplete.current) {
      postComplete.current = true;
      setTimeout(() => SheetManager.show('convert-guest-sheet'), 500);
    }
  }, [hasWeeklyScreenLoaded, isComplete, isGuest]);
};

const Index = () => {
  const insets = useSafeAreaInsets();
  usePopupTutorialSheet();

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
      <Tab.Screen name="Weekly">{() => <WeeklyScreen />}</Tab.Screen>
      <Tab.Screen name="Monthly">{() => <MonthlyScreen />}</Tab.Screen>
    </Tab.Navigator>
  );
};

export default Index;
