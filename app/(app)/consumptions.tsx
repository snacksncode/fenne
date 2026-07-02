import { ConsumptionLogDTO, MealType } from '@/api/types';
import { useAddConsumptionLog, useConsumptionLogs } from '@/api/consumption-logs';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useSheets } from '@/lib/sheet-context';
import { prettyUnit } from '@/utils/unit-formatters';
import { FlashList } from '@shopify/flash-list';
import { addDays, format, parseISO, startOfToday, subDays } from 'date-fns';
import { router } from 'expo-router';
import { ChevronLeft, CookingPot, Croissant, Drumstick } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const mealIcons = {
  breakfast: Croissant,
  lunch: CookingPot,
  dinner: Drumstick,
};

type DayRow = {
  date: string;
  logsByMeal: Partial<Record<MealType, ConsumptionLogDTO>>;
};

const useConsumptionDays = (logs: ConsumptionLogDTO[] | undefined) => {
  return useMemo(() => {
    const logsBySlot = new Map<string, ConsumptionLogDTO>();
    (logs ?? []).forEach((log) => logsBySlot.set(`${log.schedule_date}:${log.meal_type}`, log));

    return Array.from({ length: 14 }, (_, index) => {
      const date = format(addDays(subDays(startOfToday(), 13), index), 'yyyy-MM-dd');

      return {
        date,
        logsByMeal: Object.fromEntries(
          mealTypes.map((mealType) => [mealType, logsBySlot.get(`${date}:${mealType}`)])
        ) as DayRow['logsByMeal'],
      };
    }).reverse();
  }, [logs]);
};

const DeductionSummary = ({ log }: { log: ConsumptionLogDTO }) => {
  const deducted = log.deductions.filter((deduction) => deduction.actually_deducted > 0);

  if (deducted.length === 0) {
    return (
      <Typography variant="body-xs" weight="regular" color={colors.brown[700]}>
        No pantry stock was deducted
      </Typography>
    );
  }

  return (
    <Typography variant="body-xs" weight="regular" color={colors.brown[700]} numberOfLines={1}>
      {deducted
        .slice(0, 2)
        .map((deduction) => {
          const unit = deduction.product_unit
            ? ` ${prettyUnit({ quantity: deduction.actually_deducted, unit: deduction.product_unit })}`
            : '';
          return `${deduction.product_name ?? 'Product'} -${deduction.actually_deducted}${unit}`;
        })
        .join(' · ')}
      {deducted.length > 2 ? ` · +${deducted.length - 2}` : ''}
    </Typography>
  );
};

const ConsumptionSlot = ({ mealType, date, log }: { mealType: MealType; date: string; log?: ConsumptionLogDTO }) => {
  const sheets = useSheets();
  const addConsumptionLog = useAddConsumptionLog();
  const Icon = mealIcons[mealType];

  const handleAdd = async () => {
    const recipe = await sheets.present('select-recipe-sheet');
    if (!recipe) return;

    addConsumptionLog.mutate({
      recipe_id: recipe.id,
      meal_type: mealType,
      schedule_date: date,
    });
  };

  if (!log) {
    return (
      <PressableWithHaptics style={[styles.slot, styles.emptySlot]} onPress={handleAdd} scaleTo={0.98}>
        <Icon size={20} color={colors.brown[700]} strokeWidth={2.25} />
        <View style={{ flex: 1 }}>
          <Typography variant="body-sm" weight="bold" color={colors.brown[700]}>
            No {mealLabels[mealType].toLocaleLowerCase()}
          </Typography>
          <Typography variant="body-xs" weight="regular" color={colors.brown[700]}>
            Tap to add consumption
          </Typography>
        </View>
      </PressableWithHaptics>
    );
  }

  return (
    <PressableWithHaptics
      style={styles.slot}
      onPress={() => sheets.present('consumption-log-sheet', { data: { log } })}
      scaleTo={0.98}
    >
      <View style={styles.slotIcon}>
        <Icon size={20} color={colors.cream[100]} strokeWidth={2.25} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="body-base" weight="bold" numberOfLines={1}>
          {log.recipe_name || 'Unknown recipe'}
        </Typography>
        <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
          {mealLabels[mealType]}
        </Typography>
        <DeductionSummary log={log} />
      </View>
    </PressableWithHaptics>
  );
};

const DaySection = ({ day }: { day: DayRow }) => (
  <View style={styles.daySection}>
    <View style={styles.dayHeader}>
      <Typography variant="heading-sm" weight="black">
        {format(parseISO(day.date), 'EEEE')}
      </Typography>
      <Typography variant="body-sm" weight="bold" color={colors.brown[700]}>
        {format(parseISO(day.date), 'd MMM')}
      </Typography>
    </View>
    <View style={styles.slots}>
      {mealTypes.map((mealType) => (
        <ConsumptionSlot key={mealType} mealType={mealType} date={day.date} log={day.logsByMeal[mealType]} />
      ))}
    </View>
  </View>
);

const Consumptions = () => {
  const insets = useSafeAreaInsets();
  const logs = useConsumptionLogs();
  const days = useConsumptionDays(logs.data);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={20} onPress={() => router.back()}>
            <ChevronLeft color={colors.brown[900]} size={28} strokeWidth={2.25} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Typography variant="heading-md" weight="black">
              Consumptions
            </Typography>
            <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
              Last 14 days
            </Typography>
          </View>
        </View>
      </View>
      <FlashList
        data={days}
        renderItem={({ item }) => <DaySection day={item} />}
        keyExtractor={(item) => item.date}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 104,
          paddingBottom: insets.bottom + 24,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  header: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.cream[100],
    borderBottomColor: colors.brown[900],
    borderBottomWidth: 1,
  },
  headerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  list: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  daySection: {
    gap: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  slots: {
    gap: 8,
  },
  slot: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
  },
  emptySlot: {
    borderStyle: 'dashed',
    backgroundColor: colors.cream[100],
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.brown[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Consumptions;
