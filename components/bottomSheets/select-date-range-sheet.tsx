import { useSchedule } from '@/api/schedules';
import { useGroceryPreview } from '@/api/groceries';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Month } from '@/components/menu/month';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO, getISOWeeksForMonth } from '@/date-tools';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { useRouter } from 'expo-router';
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
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { filter, find, pipe, values } from 'remeda';

type Range = {
  startDateString: string;
  endDateString: string;
};

export const SelectDateRangeSheet = (props: SheetProps<'select-date-range-sheet'>) => {
  const sheets = useSheets();
  const router = useRouter();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => startOfMonth(startOfToday()));
  const weeks = getISOWeeksForMonth(formatDateToISO(startOfMonth(currentMonthDate)));
  const [range, setRange] = useState<Range>();
  const { scheduleMap, isLoading } = useSchedule({ weeks });
  const defaultRange = useMemo<Range | undefined>(() => {
    if (isLoading) return undefined;

    const result = pipe(
      values(scheduleMap),
      filter((day) => isAfter(parseISO(day.date), endOfToday())),
      find((day) => day.is_shopping_day)
    );

    return {
      startDateString: formatDateToISO(startOfTomorrow()),
      endDateString: result?.date ?? formatDateToISO(addWeeks(startOfToday(), 1)),
    };
  }, [isLoading, scheduleMap]);
  const selectedRange = range ?? defaultRange;
  const previewQuery = useGroceryPreview({
    start: selectedRange?.startDateString,
    end: selectedRange?.endDateString,
    enabled: false,
  });

  const tryExpandingRange = ({ dateString }: { dateString: string }) => {
    setRange((prev) => {
      const currentRange = prev ?? selectedRange;
      if (!currentRange) return { startDateString: dateString, endDateString: dateString };
      const clickedDate = parseISO(dateString);
      const rangeStart = parseISO(currentRange.startDateString);
      const rangeEnd = parseISO(currentRange.endDateString);
      if (isBefore(clickedDate, rangeStart)) return { ...currentRange, startDateString: dateString };
      if (isAfter(clickedDate, rangeEnd)) return { ...currentRange, endDateString: dateString };
      return { startDateString: dateString, endDateString: dateString };
    });
  };

  const handleGenerate = () => {
    if (!selectedRange) return;
    previewQuery.refetch().then(() => {
      sheets.dismiss(props.sheetId);
      router.push({
        pathname: '/generate-preview',
        params: { startDate: selectedRange.startDateString, endDate: selectedRange.endDateString },
      });
    });
  };

  return (
    <BaseSheet
      id={props.sheetId}
      containerStyle={{ paddingBottom: 60 }}
      footer={
        <View style={{ gap: 12 }}>
          <Button
            variant="primary"
            onPress={handleGenerate}
            text="Generate"
            leftIcon={{ Icon: WandSparkles }}
            isLoading={previewQuery.isFetching}
          />
          <Button onPress={() => sheets.dismiss(props.sheetId)} variant="outlined" text="Cancel" />
        </View>
      }
    >
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
        selectedRange={selectedRange}
        scheduleMap={isLoading || !selectedRange ? {} : scheduleMap}
      />
    </BaseSheet>
  );
};
