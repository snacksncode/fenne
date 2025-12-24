import { useGenerateGroceryItems } from '@/api/groceries';
import { ScheduleDayDTO, useSchedule } from '@/api/schedules';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Month } from '@/components/menu/month';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { formatDateToISO, getISOWeeksForMonth } from '@/date-tools';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  addMonths,
  addWeeks,
  endOfToday,
  format,
  formatDate,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfTomorrow,
} from 'date-fns';
import { ChevronLeft, ChevronRight, WandSparkles } from 'lucide-react-native';
import { RefObject, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { doNothing, filter, find, isEmpty, pipe, values } from 'remeda';

type SheetProps = {
  ref: RefObject<BottomSheetModal | null>;
};

type Range = {
  startDateString: string;
  endDateString: string;
};

const Content = ({ ref }: SheetProps) => {
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
      { onSuccess: () => ref.current?.dismiss() }
    );
  };

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>Select a range</Text>
      <Text style={styles.info}>
        The shopping list will be generated for days that are selected in{' '}
        <Text style={{ fontFamily: 'Satoshi-Black', color: colors.green[600] }}>green</Text>
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={styles.currentMonth}>{format(currentMonthDate, 'MMMM yyyy')}</Text>
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
      <Button style={{ marginTop: 12 }} onPress={() => ref.current?.dismiss()} variant="outlined" text="Cancel" />
    </BaseSheet.Container>
  );
};

export const SelectDateRangeSheet = ({ ref }: SheetProps) => {
  return (
    <BaseSheet ref={ref}>
      <Content ref={ref} />
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },

  info: {
    marginBottom: 16,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 16 * 1.4,
  },

  currentMonth: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.25,
  },
});
