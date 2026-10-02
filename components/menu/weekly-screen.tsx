import { AnimatedFlashList, ListLayoutView } from '@/components/animated-list';
import { Typography } from '@/components/Typography';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDays,
  eachDayOfInterval,
  format,
  startOfToday,
} from 'date-fns';

import Animated from 'react-native-reanimated';

import { isTruthy } from 'remeda';
import { Button } from '@/components/button';
import { formatDateToISO, parseISO } from '@/date-tools';
import { useScheduleViewport } from '@/hooks/use-schedule-viewport';
export { hasWeeklyScreenLoadedAtom } from '@/hooks/use-schedule-viewport';
import { useSheets } from '@/lib/sheet-context';
import { MealEntry } from '@/components/menu/meal-entry';
import { Plus, Soup } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { ScheduleDayDTO } from '@/api/types';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { useToday } from '@/hooks/use-today';

const GAP_SIZE = 16;
const HEADER_SIZE = 59;

const DayCardSkeleton = () => {
  return (
    <View
      style={{
        backgroundColor: '#FEF2DD',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderColor: '#EEDBB9',
        borderWidth: 1,
        borderBottomWidth: 2,
        height: 116,
        gap: 8,
      }}
    >
      <View>
        <View style={{ width: '40%', height: 12, backgroundColor: '#EEDBB9', borderRadius: 4 }} />
        <View style={{ width: '80%', height: 18, backgroundColor: '#EEDBB9', borderRadius: 4, marginTop: 4 }} />
      </View>
      <View style={{ height: 1, backgroundColor: '#EEDBB9' }} />
      <View>
        <View style={{ width: '30%', height: 12, backgroundColor: '#EEDBB9', borderRadius: 4 }} />
        <View style={{ width: '60%', height: 18, backgroundColor: '#EEDBB9', borderRadius: 4, marginTop: 4 }} />
      </View>
    </View>
  );
};

const ItemSkeleton = ({ date }: { date: Date }) => {
  const today = useToday();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Typography variant="heading-sm" weight="bold">
          {formatDateToISO(date) === today ? format(date, 'EEEE') : format(date, 'EEEE, d MMMM')}
        </Typography>
        {formatDateToISO(date) === today ? (
          <View
            style={{
              backgroundColor: colors.orange[500],
              borderColor: colors.orange[600],
              borderWidth: 1,
              borderBottomWidth: 2,
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body-xs" weight="bold" color="white">
              Today
            </Typography>
          </View>
        ) : null}
      </View>
      <DayCardSkeleton />
    </View>
  );
};

const WeeklyScreenSkeleton = () => {
  const insets = useSafeAreaInsets();
  const start = startOfToday();
  const end = addDays(start, 7);
  const days = eachDayOfInterval({ start, end });

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: insets.top + HEADER_SIZE + GAP_SIZE,
        paddingBottom: insets.bottom + 88,
        gap: GAP_SIZE,
      }}
    >
      {days.map((date, index) => (
        <ItemSkeleton date={date} key={index} />
      ))}
    </View>
  );
};

const DayCard = ({ data }: { data: ScheduleDayDTO }) => {
  const sheets = useSheets();
  const entries = [
    data.breakfast ? { ...data.breakfast, mealType: 'breakfast' as const } : null,
    data.lunch ? { ...data.lunch, mealType: 'lunch' as const } : null,
    data.dinner ? { ...data.dinner, mealType: 'dinner' as const } : null,
  ].filter(isTruthy);

  const onPress = () => {
    sheets.present('schedule-meal-sheet', {
      data: { type: 'meal', dateString: data.date },
    });
  };

  return (
    <ListLayoutView
      style={{
        backgroundColor: '#FEF2DD',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderColor: '#4A3E36',
        borderWidth: 1,
        borderBottomWidth: 2,
      }}
    >
      {entries.map((entry, index) => (
        <ListLayoutView key={entry.mealType}>
          <MealEntry entry={entry} dateString={data.date} />
          {index !== entries.length - 1 ? (
            <ListLayoutView
              style={{
                height: 1,
                backgroundColor: '#EEDBB9',
                marginVertical: 8,
              }}
            />
          ) : null}
        </ListLayoutView>
      ))}
      {entries.length !== 3 ? (
        <ListLayoutView
          style={{
            marginHorizontal: -16,
            marginBottom: -12,
            marginTop: 16,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            backgroundColor: '#FEEED2',
            height: 40,
          }}
        >
          <ListLayoutView
            style={{
              position: 'relative',
              top: 0,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#EEDBB9',
            }}
          />
          <PressableWithHaptics style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={onPress}>
            <ListLayoutView style={{ flexDirection: 'row', gap: 4 }}>
              <Plus color="#4A3E36" size={18} strokeWidth={2.5} />
              <Typography variant="body-sm" weight="bold">
                Another Meal?
              </Typography>
            </ListLayoutView>
          </PressableWithHaptics>
        </ListLayoutView>
      ) : null}
    </ListLayoutView>
  );
};

const EmptyDayCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <PressableWithHaptics onPress={onPress}>
      <ListLayoutView
        style={{
          backgroundColor: '#FEF4E2',
          padding: 16,
          paddingBottom: 20,
          borderRadius: 8,
          borderColor: '#D1C5B3',
          borderStyle: 'dashed',
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 116,
        }}
      >
        <Soup size={24} color="#4A3E36" />
        <Typography variant="body-base" weight="black" style={{ marginTop: 8 }}>
          No meals planned
        </Typography>
        <Typography variant="body-sm" weight="bold">
          Tap to add a meal
        </Typography>
      </ListLayoutView>
    </PressableWithHaptics>
  );
};

const Day = ({ dateString, data }: { dateString: string; data: ScheduleDayDTO | undefined }) => {
  const sheets = useSheets();
  if (!data) return <DayCardSkeleton />;

  if (!data.breakfast && !data.lunch && !data.dinner) {
    const onPress = () => {
      sheets.present('schedule-meal-sheet', { data: { type: 'meal', dateString } });
    };
    return <EmptyDayCard onPress={onPress} />;
  }

  return <DayCard data={data} />;
};

const Item = ({ dateString, data }: { dateString: string; data: ScheduleDayDTO | undefined }) => {
  const date = parseISO(dateString);
  const today = useToday();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Typography variant="heading-sm" weight="bold">
          {format(date, 'EEEE')}
        </Typography>
        {dateString === today ? (
          <View
            style={{
              backgroundColor: colors.orange[500],
              borderColor: colors.orange[600],
              borderWidth: 1,
              borderBottomWidth: 2,
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body-xs" weight="bold" color="white">
              Today
            </Typography>
          </View>
        ) : null}
        <Typography variant="body-sm" weight="bold" color={colors.brown[700]} style={{ flex: 1, textAlign: 'right' }}>
          {format(date, 'd MMM')}
        </Typography>
      </View>
      <Day data={data} dateString={dateString} />
    </View>
  );
};

export const WeeklyScreen = () => {
  const insets = useSafeAreaInsets();
  const viewport = useScheduleViewport(insets.top + HEADER_SIZE + GAP_SIZE);

  return (
    <>
      <Animated.View
        style={[
          {
            width: '100%',
            alignItems: 'center',
            position: 'absolute',
            zIndex: 10,
            top: insets.top + HEADER_SIZE + 16,
          },
          viewport.backToTodayStyle,
        ]}
      >
        <Button
          variant="primary"
          text="Back to today"
          size="small"
          onPress={viewport.returnToToday}
        />
      </Animated.View>
      {!viewport.hasLoaded && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: '#FEF7EA' }}>
          <WeeklyScreenSkeleton />
        </View>
      )}
      {viewport.hasSchedule && (
        <AnimatedFlashList
          ref={viewport.listRef}
          data={viewport.days}
          renderItem={({ item }) => <Item dateString={item.date} data={item.schedule} />}
          style={{ backgroundColor: colors.cream[100], flex: 1 }}
          keyExtractor={(item) => item.date}
          ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            marginTop: insets.top + HEADER_SIZE,
            paddingBottom: insets.bottom + 88,
          }}
          {...viewport.listProps}
        />
      )}
    </>
  );
};
