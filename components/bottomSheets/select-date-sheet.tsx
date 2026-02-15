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
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export const SelectDateSheet = (props: SheetProps<'select-date-sheet'>) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => startOfMonth(startOfToday()));
  const weeks = getISOWeeksForMonth(formatDateToISO(startOfMonth(currentMonthDate)));
  const { scheduleMap } = useSchedule({ weeks });

  const handleDaySelect = async ({ dateString }: { dateString: string }) => {
    await SheetManager.hide(props.sheetId);
    SheetManager.show('schedule-meal-sheet', { payload: { type: 'meal', dateString } });
  };

  const leftArrow = useOnPressWithFeedback({
    onPress: () => setCurrentMonthDate((prev) => startOfMonth(addMonths(prev, -1))),
    scaleTo: 0.75,
  });
  const rightArrow = useOnPressWithFeedback({
    onPress: () => setCurrentMonthDate((prev) => startOfMonth(addMonths(prev, 1))),
    scaleTo: 0.75,
  });

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 16 }}>
        Select a day
      </Typography>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography variant="body-base" weight="bold">
          {format(currentMonthDate, 'MMMM yyyy')}
        </Typography>
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
      <Month startOfMonthDate={currentMonthDate} onDaySelect={handleDaySelect} scheduleMap={scheduleMap} />
      <Button
        style={{ marginTop: 32 }}
        onPress={() => SheetManager.hide(props.sheetId)}
        variant="outlined"
        text="Cancel"
      />
    </BaseSheet>
  );
};
