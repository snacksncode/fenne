import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SheetAction } from '@/components/sheet-action';
import { Typography } from '@/components/Typography';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { CalendarPlus, CalendarSearch } from 'lucide-react-native';
import { View } from 'react-native';
import { Tag } from '@/components/svgs/tag';
import { format } from 'date-fns';
import { getISOWeekString, parseISO } from '@/date-tools';
import { colors } from '@/constants/colors';
import { useSetAtom } from 'jotai';
import { getFirstMissingMealType, scrollTargetAtom } from '@/components/menu/weekly-screen';
import { useSchedule, useUpdateScheduleDay } from '@/api/schedules';
import { ensure } from '@/utils';

export const EditCalendarDaySheet = (props: SheetProps<'edit-calendar-day-sheet'>) => {
  const { dateString, navigation } = ensure(props.payload);
  const { scheduleMap } = useSchedule({ weeks: dateString ? [getISOWeekString(dateString)] : [] });
  const setScrollTarget = useSetAtom(scrollTargetAtom);
  const updateScheduleDay = useUpdateScheduleDay();

  const scheduleDay = scheduleMap[dateString];
  const is_shopping_day = scheduleDay?.is_shopping_day ?? false;

  return (
    <BaseSheet id={props.sheetId}>
      <View style={{ marginBottom: 24 }}>
        <Typography variant="heading-sm" weight="bold">
          What to do with{'\n'}
          <Typography
            variant="heading-sm"
            weight="bold"
            style={{ backgroundColor: colors.orange[100], paddingHorizontal: 4, paddingVertical: 2, marginTop: 4 }}
          >
            &ldquo;{format(parseISO(dateString), 'EEEE, d MMMM')}&rdquo;
          </Typography>
          ?
        </Typography>
      </View>
      <View style={{ gap: 16, marginBottom: 12 }}>
        <SheetAction
          text="Schedule meal"
          icon={CalendarPlus}
          onPress={async () => {
            await SheetManager.hide(props.sheetId);
            SheetManager.show('schedule-meal-sheet', {
              payload: {
                type: 'meal',
                dateString,
              },
            });
          }}
        />
        <SheetAction
          text='Find in "Weekly"'
          icon={CalendarSearch}
          onPress={() => {
            setScrollTarget({ dateString });
            navigation.navigate('Weekly');
            SheetManager.hide(props.sheetId);
          }}
        />
        <SheetAction
          text={is_shopping_day ? 'Unmark as shopping day' : 'Mark as shopping day'}
          icon={Tag}
          onPress={() => {
            updateScheduleDay.mutate({ dateString, is_shopping_day: !is_shopping_day });
            SheetManager.hide(props.sheetId);
          }}
        />
      </View>
    </BaseSheet>
  );
};
