import { useGenerateGroceryItems } from '@/api/groceries';
import { useSchedule } from '@/api/schedules';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Month } from '@/components/menu/month';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO, getISOWeeksForMonth } from '@/date-tools';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import {
  addMonths,
  addWeeks,
  endOfToday,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfTomorrow,
} from 'date-fns';
import { ChevronLeft, ChevronRight, WandSparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { filter, find, pipe, values } from 'remeda';

type Range = {
  startDateString: string;
  endDateString: string;
};

export const SelectDateRangeSheet = (props: SheetProps<'select-date-range-sheet'>) => {
  const generateGroceryItems = useGenerateGroceryItems();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => startOfMonth(startOfToday()));
  const weeks = getISOWeeksForMonth(formatDateToISO(startOfMonth(currentMonthDate)));
  const [range, setRange] = useState<Range>();
  const { scheduleMap, isLoading } = useSchedule({ weeks });

  useEffect(() => {
    if (isLoading || range != null) return;
    const result = pipe(
      values(scheduleMap),
      filter((day) => isAfter(parseISO(day.date), endOfToday())),
      find((day) => day.is_shopping_day)
    );
    const startDateString = formatDateToISO(startOfTomorrow());
    const endDateString = result?.date ?? formatDateToISO(addWeeks(startOfToday(), 1));
    setRange({ startDateString, endDateString });
  }, [isLoading, range, scheduleMap]);

  const tryExpandingRange = ({ dateString }: { dateString: string }) => {
    setRange((prev) => {
      if (!prev) return { startDateString: dateString, endDateString: dateString };
      const clickedDate = parseISO(dateString);
      const rangeStart = parseISO(prev.startDateString);
      const rangeEnd = parseISO(prev.endDateString);
      if (isBefore(clickedDate, rangeStart)) return { ...prev, startDateString: dateString };
      if (isAfter(clickedDate, rangeEnd)) return { ...prev, endDateString: dateString };
      return { startDateString: dateString, endDateString: dateString };
    });
  };

  const handleGenerate = () => {
    if (!range) return;
    generateGroceryItems.mutate(
      { start: range.startDateString, end: range.endDateString },
      { onSuccess: () => SheetManager.hide(props.sheetId) }
    );
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 4 }}>
        Which days?
      </Typography>
      <Typography variant="body-base" weight="regular" style={{ marginBottom: 16, lineHeight: 16 * 1.4 }}>
        Shopping list is for the{' '}
        <Typography variant="body-base" weight="bold" style={{ color: colors.green[600] }}>
          green
        </Typography>{' '}
        days only{'\n'}
        <Typography variant="body-base" weight="bold" style={{ color: colors.orange[600] }}>
          Pro tip:
        </Typography>{' '}
        Tap on a day to expand the selection!
      </Typography>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography variant="body-base" weight="bold">
          {format(currentMonthDate, 'MMMM yyyy')}
        </Typography>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PressableWithHaptics
            onPress={() => setCurrentMonthDate((prev) => startOfMonth(addMonths(prev, -1)))}
            scaleTo={0.75}
          >
            <ChevronLeft size={24} color="#4A3E36" />
          </PressableWithHaptics>
          <PressableWithHaptics
            onPress={() => setCurrentMonthDate((prev) => startOfMonth(addMonths(prev, 1)))}
            scaleTo={0.75}
          >
            <ChevronRight size={24} color="#4A3E36" />
          </PressableWithHaptics>
        </View>
      </View>
      <Month
        startOfMonthDate={currentMonthDate}
        onDaySelect={tryExpandingRange}
        selectedRange={range}
        scheduleMap={isLoading || !range ? {} : scheduleMap}
      />
      <Button
        style={{ marginTop: 32 }}
        variant="primary"
        onPress={handleGenerate}
        isLoading={generateGroceryItems.isPending}
        text="Generate"
        leftIcon={{ Icon: WandSparkles }}
      />
      <Button
        style={{ marginTop: 12 }}
        onPress={() => SheetManager.hide(props.sheetId)}
        variant="outlined"
        text="Cancel"
      />
    </BaseSheet>
  );
};
