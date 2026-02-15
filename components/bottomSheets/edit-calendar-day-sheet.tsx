import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { CalendarPlus, CalendarSearch } from 'lucide-react-native';
import { FunctionComponent } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Tag } from '@/components/svgs/tag';
import { format } from 'date-fns';
import { getISOWeekString, parseISO } from '@/date-tools';
import { colors } from '@/constants/colors';
import { useSetAtom } from 'jotai';
import { getFirstMissingMealType, scrollTargetAtom } from '@/components/menu/weekly-screen';
import { useSchedule, useUpdateScheduleDay } from '@/api/schedules';
import { ensure } from '@/utils';

const Action = (props: {
  onPress: () => void;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
}) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress: props.onPress, scaleTo: 0.985 });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flexDirection: 'row', gap: 12, alignItems: 'center' }, scaleStyle]}>
        <View style={{ backgroundColor: '#493D34', padding: 4, borderRadius: 4 }}>
          <props.icon color="#FEF7EA" size={20} />
        </View>
        <Typography variant="body-base" weight="bold">
          {props.text}
        </Typography>
      </Animated.View>
    </GestureDetector>
  );
};

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
        <Action
          text="Schedule meal"
          icon={CalendarPlus}
          onPress={async () => {
            await SheetManager.hide(props.sheetId);
            SheetManager.show('schedule-meal-sheet', {
              payload: {
                type: 'meal',
                dateString,
                mealType: scheduleDay ? getFirstMissingMealType(scheduleDay) : undefined,
              },
            });
          }}
        />
        <Action
          text='Find in "Weekly"'
          icon={CalendarSearch}
          onPress={() => {
            setScrollTarget({ dateString });
            navigation.navigate('Weekly');
            SheetManager.hide(props.sheetId);
          }}
        />
        <Action
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
