import { useSchedule } from '@/api/schedules';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Month } from '@/components/menu/month';
import { Typography } from '@/components/Typography';
import { formatDateToISO, getISOWeeksForMonth } from '@/date-tools';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { addMonths, format, startOfMonth, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const slideInLeft = SlideInLeft.duration(450).build();
const slideInRight = SlideInRight.duration(450).build();
const slideOutLeft = SlideOutLeft.duration(450).build();
const slideOutRight = SlideOutRight.duration(450).build();

export const SelectDateSheet = (props: SheetProps<'select-date-sheet'>) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => startOfMonth(startOfToday()));
  const weeks = getISOWeeksForMonth(formatDateToISO(startOfMonth(currentMonthDate)));
  const { scheduleMap } = useSchedule({ weeks });
  const direction = useSharedValue<'left' | 'right' | null>(null);

  const handleDaySelect = async ({ dateString }: { dateString: string }) => {
    await SheetManager.hide(props.sheetId);
    SheetManager.show('schedule-meal-sheet', { payload: { type: 'meal', dateString } });
  };

  const goToPrevMonth = () => {
    direction.value = 'left';
    setCurrentMonthDate((prev) => startOfMonth(addMonths(prev, -1)));
  };
  const goToNextMonth = () => {
    direction.value = 'right';
    setCurrentMonthDate((prev) => startOfMonth(addMonths(prev, 1)));
  };

  const entering = (values: any) => {
    'worklet';
    if (direction.value === null) return { initialValues: {}, animations: {} };
    return direction.value === 'right' ? slideInRight(values) : slideInLeft(values);
  };

  const exiting = (values: any) => {
    'worklet';
    if (direction.value === null) return { initialValues: {}, animations: {} };
    return direction.value === 'right' ? slideOutLeft(values) : slideOutRight(values);
  };

  const leftArrow = useOnPressWithFeedback({ onPress: goToPrevMonth, scaleTo: 0.75 });
  const rightArrow = useOnPressWithFeedback({ onPress: goToNextMonth, scaleTo: 0.75 });

  const swipeGesture = Gesture.Race(
    Gesture.Fling()
      .direction(Directions.LEFT)
      .onEnd(() => scheduleOnRN(goToNextMonth)),
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .onEnd(() => scheduleOnRN(goToPrevMonth))
  );

  return (
    <BaseSheet id={props.sheetId}>
      <BaseSheet.Container>
        <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 16 }}>
          Select a day
        </Typography>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Animated.View key={`label-${currentMonthDate.getTime()}`} entering={FadeIn} exiting={FadeOut}>
            <Typography variant="body-base" weight="bold">
              {format(currentMonthDate, 'MMMM yyyy')}
            </Typography>
          </Animated.View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <GestureDetector gesture={leftArrow.gesture}>
              <Animated.View style={leftArrow.scaleStyle}>
                <ChevronLeft size={24} color="#4A3E36" />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={rightArrow.gesture}>
              <Animated.View style={rightArrow.scaleStyle}>
                <ChevronRight size={24} color="#4A3E36" />
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={{ overflow: 'hidden' }}>
            <Animated.View key={currentMonthDate.getTime()} entering={entering} exiting={exiting}>
              <Month startOfMonthDate={currentMonthDate} onDaySelect={handleDaySelect} scheduleMap={scheduleMap} />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
        <Button
          style={{ marginTop: 32 }}
          onPress={() => SheetManager.hide(props.sheetId)}
          variant="outlined"
          text="Cancel"
        />
      </BaseSheet.Container>
    </BaseSheet>
  );
};
