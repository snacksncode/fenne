import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Text } from '@/components/Text';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { BottomSheetModal, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { CalendarSearch } from 'lucide-react-native';
import { FunctionComponent, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Tag } from '@/components/svgs/tag';
import { format } from 'date-fns';
import { getISOWeekString, parseISO } from '@/date-tools';
import { colors } from '@/constants/colors';
import { NavigationHelpers } from '@react-navigation/native';
import { useSetAtom } from 'jotai';
import { scrollTargetAtom } from '@/components/menu/weekly-screen';
import { TabParamList } from '@/app/(app)/(tabs)';
import { useSchedule, useUpdateScheduleDay } from '@/api/schedules';

export type EditCalendarDaySheetData = { dateString: string };

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditCalendarDaySheetData> | null>;
  navigation: NavigationHelpers<TabParamList>;
};

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
        <Text style={styles.actionText}>{props.text}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const Content = ({ date, ref, navigation }: { date: string } & SheetProps) => {
  const { scheduleMap } = useSchedule({ weeks: [getISOWeekString(date)] });
  const setScrollTarget = useSetAtom(scrollTargetAtom);
  const updateScheduleDay = useUpdateScheduleDay();
  const isShoppingDay = scheduleMap[date].is_shopping_day;

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>
        What to do with{'\n'}
        <Text style={{ backgroundColor: colors.orange[100] }}>
          &ldquo;{format(parseISO(date), 'EEEE, d MMMM')}&rdquo;
        </Text>
        ?
      </Text>
      <View style={{ gap: 16, marginBottom: 12 }}>
        <Action
          text='Find in "Weekly"'
          icon={CalendarSearch}
          onPress={() => {
            setScrollTarget({ dateString: date });
            navigation.navigate('Weekly');
            ref.current?.dismiss();
          }}
        />
        <Action
          text={isShoppingDay ? 'Unmark as shopping day' : 'Mark as shopping day'}
          icon={Tag}
          onPress={() => {
            updateScheduleDay.mutate({ date, data: { date, is_shopping_day: !isShoppingDay } });
            ref.current?.dismiss();
          }}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const EditCalendarDaySheet = ({ ref, navigation }: SheetProps) => {
  return (
    <BaseSheet<EditCalendarDaySheetData> ref={ref}>
      {({ data }) => data && <Content date={data.dateString} ref={ref} navigation={navigation} />}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  actionText: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.25,
  },
});
