import { View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteTitle } from '@/components/RouteTitle';
import { Button } from '@/components/button';
import { useSheets } from '@/lib/sheet-context';
import { hasWeeklyScreenLoadedAtom, WeeklyScreen } from '@/components/menu/weekly-screen';
import { CalendarPlus, Utensils } from 'lucide-react-native';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import Animated from 'react-native-reanimated';
import { useTabFocusAnimation } from '@/hooks/use-tab-focus-animation';

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
  const blurTarget = useRef<View | null>(null);
  const sheets = useSheets();
  const insets = useSafeAreaInsets();
  usePopupTutorialSheet();
  const tabFocusStyle = useTabFocusAnimation();

  const showSelectDateSheet = () => {
    sheets.present('select-date-sheet');
  };

  return (
    <Animated.View style={tabFocusStyle}>
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        <WeeklyScreen />
      </BlurTargetView>
      <RouteTitle blurTarget={blurTarget} icon={Utensils} text="Menu" />
      <Button
        variant="primary"
        onPress={showSelectDateSheet}
        text="Schedule Meal"
        leftIcon={{ Icon: CalendarPlus }}
        style={{ position: 'absolute', bottom: insets.bottom + 88, right: 16 }}
      />
    </Animated.View>
  );
};

export default Index;
