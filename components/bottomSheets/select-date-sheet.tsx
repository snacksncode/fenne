import { useSchedule } from '@/api/schedules';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Month } from '@/components/menu/month';
import { Typography } from '@/components/Typography';
import { formatDateToISO, getISOWeeksForMonth, parseISO } from '@/date-tools';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { SheetProps, useSheets } from '@/lib/sheet-context';
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
  const sheets = useSheets();
  const mode = props.data?.mode ?? 'schedule';
  const initialDate = props.data?.initialDate ?? formatDateToISO(startOfToday());
  const [currentMonthDate, setCurrentMonthDate] = useState(() => startOfMonth(parseISO(initialDate)));
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const weeks = getISOWeeksForMonth(formatDateToISO(startOfMonth(currentMonthDate)));
  const { scheduleMap } = useSchedule({ weeks });
  const direction = useSharedValue<'left' | 'right' | null>(null);

  const handleDaySelect = ({ dateString }: { dateString: string }) => {
    if (mode === 'select') {
      sheets.dismiss(props.sheetId, dateString);
      return;
    }

    sheets.present('schedule-meal-sheet', { data: { type: 'meal', dateString } });
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
    <BaseSheet
      id={props.sheetId}
      onDidPresent={() => setAnimationsEnabled(true)}
      footer={sheetFooter.buttonRow(
        <Button onPress={() => sheets.dismiss(props.sheetId, undefined)} variant="outlined" text="Cancel" />
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 16 }}>
        {mode === 'select' ? 'Select a date' : 'Select a day'}
      </Typography>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Animated.View
          key={`label-${currentMonthDate.getTime()}`}
          entering={animationsEnabled ? FadeIn : undefined}
          exiting={animationsEnabled ? FadeOut : undefined}
        >
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
          <Animated.View
            key={currentMonthDate.getTime()}
            entering={animationsEnabled ? entering : undefined}
            exiting={animationsEnabled ? exiting : undefined}
          >
            <Month
              startOfMonthDate={currentMonthDate}
              onDaySelect={handleDaySelect}
              scheduleMap={scheduleMap}
              selectedRange={
                mode === 'select' ? { startDateString: initialDate, endDateString: initialDate } : undefined
              }
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </BaseSheet>
  );
};
