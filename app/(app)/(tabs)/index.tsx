import { createMaterialTopTabNavigator } from 'expo-router/js-top-tabs';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopTabBar } from '@/components/TopTabBar';
import { RouteTitle } from '@/components/RouteTitle';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { useSheets } from '@/lib/sheet-context';
import { hasWeeklyScreenLoadedAtom, WeeklyScreen } from '@/components/menu/weekly-screen';
import { MonthlyScreen } from '@/components/menu/monthly-screen';
import { CalendarPlus } from 'lucide-react-native';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import Animated from 'react-native-reanimated';
import { useTabFocusAnimation } from '@/hooks/use-tab-focus-animation';

export type TabParamList = {
  Weekly: undefined;
  Monthly: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

const usePopupTutorialSheet = () => {
  const sheets = useSheets();
  const hasWeeklyScreenLoaded = useAtomValue(hasWeeklyScreenLoadedAtom);
  const { isGuest, isComplete } = useTutorialProgress();
  const preComplete = useRef(false);
  const postComplete = useRef(false);

  useEffect(() => {
    if (!hasWeeklyScreenLoaded || !isGuest) return;
    if (!isComplete && !preComplete.current) {
      preComplete.current = true;
      sheets.present('tutorial-sheet');
    }
    if (isComplete && !postComplete.current) {
      postComplete.current = true;
      setTimeout(() => sheets.present('convert-guest-sheet'), 500);
    }
  }, [hasWeeklyScreenLoaded, isComplete, isGuest, sheets]);
};

const Index = () => {
  const sheets = useSheets();
  const insets = useSafeAreaInsets();
  usePopupTutorialSheet();
  const tabFocusStyle = useTabFocusAnimation();

  const showSelectDateSheet = () => {
    sheets.present('select-date-sheet');
  };

  return (
    <Animated.View style={tabFocusStyle}>
      <Tab.Navigator
        layout={({ children }) => (
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
        tabBar={(props: MaterialTopTabBarProps) => (
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
    </Animated.View>
  );
};

export default Index;
