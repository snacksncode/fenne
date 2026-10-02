import { createFuzzySearch } from '@/utils/fuzzy-search';
import { AnimatedFlashList, ListLayoutView } from '@/components/animated-list';
import { useActiveTabPress } from '@/hooks/use-active-tab-press';
import { BlurTargetView } from 'expo-blur';
import { usePantry } from '@/api/pantry';
import { AisleCategory, PantryEntryDTO } from '@/api/types';
import { AISLE_CATEGORIES, AisleHeader } from '@/components/aisle-header';
import { PantryFilter } from '@/components/bottomSheets/pantry-filter-sheet';
import { Button } from '@/components/button';
import { DashedDivider } from '@/components/dashed-divider';
import { EmptyState } from '@/components/empty-state';
import { TextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { RouteTitle } from '@/components/RouteTitle';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useTabFocusAnimation } from '@/hooks/use-tab-focus-animation';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';
import { useSheets } from '@/lib/sheet-context';
import { prettyUnit } from '@/lib/quantity';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  parseISO,
  startOfDay,
  startOfToday,
} from 'date-fns';
import { Archive, Boxes, Check, Funnel, History, Plus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

type PantryAisle = { aisle: AisleCategory; entries: PantryEntryDTO[] };

const useFilteredEntries = (entries: PantryEntryDTO[] | undefined, filter: PantryFilter, search: string) => {
  const index = useMemo(() => {
    const pantryEntries = entries ?? [];
    const visible = pantryEntries.filter((entry) => !entry.product.is_kitchen_basic);

    const filtered = visible.filter((entry) => {
      if (filter === 'tracked') return entry.product.shape === 'counted' || entry.product.shape === 'measured';
      if (filter === 'reminders') return entry.product.shape === 'timed';
      return true;
    });

    const sorted = filtered.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return createFuzzySearch({ items: sorted, getSearchTerms: (entry) => [entry.product.name] });
  }, [entries, filter]);
  return useMemo(() => index.search(search).items, [index, search]);
};

const usePantryAisles = (entries: PantryEntryDTO[]) => {
  return useMemo(() => {
    const grouped = new Map<AisleCategory, PantryEntryDTO[]>();

    entries.forEach((entry) => {
      const aisleEntries = grouped.get(entry.product.aisle) ?? [];
      aisleEntries.push(entry);
      grouped.set(entry.product.aisle, aisleEntries);
    });

    return AISLE_CATEGORIES.flatMap((aisle) => {
      const aisleEntries = grouped.get(aisle);
      return aisleEntries ? [{ aisle, entries: aisleEntries }] : [];
    });
  }, [entries]);
};

const frequencyTarget = (entry: PantryEntryDTO) => {
  const value = entry.product.reminder_frequency_value;
  const unit = entry.product.reminder_frequency_unit;
  const acquiredAt = entry.last_acquired ? parseISO(entry.last_acquired) : null;

  if (!value || !unit || !acquiredAt) return null;
  if (unit === 'days') return addDays(acquiredAt, value);
  if (unit === 'weeks') return addWeeks(acquiredAt, value);
  return addMonths(acquiredAt, value);
};

const timedStatus = (entry: PantryEntryDTO) => {
  const acquiredAt = entry.last_acquired ? parseISO(entry.last_acquired) : null;
  const target = frequencyTarget(entry);
  if (!acquiredAt || !target) {
    return { label: '?', hint: 'Reminder date missing', remainingRatio: 0, isRunningLow: false };
  }

  const today = startOfToday();
  const acquiredDay = startOfDay(acquiredAt);
  const targetDay = startOfDay(target);
  const total = Math.max(1, targetDay.getTime() - acquiredDay.getTime());
  const calendarDaysSinceAcquired = differenceInCalendarDays(today, acquiredDay);
  const elapsedDays = Math.max(0, calendarDaysSinceAcquired);
  const elapsed = Math.max(0, today.getTime() - acquiredDay.getTime());
  const ratio = elapsed / total;
  const remainingDays = differenceInCalendarDays(targetDay, today);

  const label =
    remainingDays <= 0 ? 'Now' : remainingDays < 14 ? `${remainingDays}d` : `${Math.ceil(remainingDays / 7)}w`;
  const boughtLabel =
    calendarDaysSinceAcquired < 0
      ? `Acquired in ${Math.abs(calendarDaysSinceAcquired)}d`
      : elapsedDays === 0
        ? 'Bought today'
        : elapsedDays === 1
          ? 'Bought yesterday'
          : `Bought ${elapsedDays}d ago`;
  const hint = remainingDays <= 0 ? `${boughtLabel} · due now` : `${boughtLabel} · ${label} left`;

  const remainingRatio = Math.max(0, Math.min(1, 1 - ratio));
  const isRunningLow = ratio >= 0.75;

  return { label, hint, remainingRatio, isRunningLow };
};

const RING_SIZE = 24;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ReminderIndicator = ({ entry }: { entry: PantryEntryDTO }) => {
  const status = timedStatus(entry);
  const trackColor = status.isRunningLow ? colors.red[50] : colors.orange[100];
  const progressColor = status.isRunningLow ? colors.red[500] : colors.orange[500];

  return (
    <View style={styles.reminderIndicator} accessibilityLabel={`Reminder ${status.label}`}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={progressColor}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - status.remainingRatio)}
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
    </View>
  );
};

const QuantityIndicator = ({ entry }: { entry: PantryEntryDTO }) => {
  if (entry.product.shape === 'timed') {
    return <ReminderIndicator entry={entry} />;
  }

  const label =
    entry.product.shape === 'counted'
      ? `${entry.quantity_remaining}`
      : `${entry.quantity_remaining} ${prettyUnit({ quantity: entry.quantity_remaining, unit: entry.product.unit })}`;

  return (
    <View style={styles.quantityPill}>
      <Typography variant="body-sm" weight="bold" color={colors.cream[100]} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
};

const PantryRow = ({ entry }: { entry: PantryEntryDTO }) => {
  const sheets = useSheets();
  const status = entry.product.shape === 'timed' ? timedStatus(entry) : null;

  return (
    <PressableWithHaptics
      style={styles.row}
      scaleTo={0.98}
      onPress={() => sheets.present('pantry-entry-sheet', { data: { entry } })}
    >
      <View style={styles.rowText}>
        <Typography variant="body-base" weight="bold" numberOfLines={1}>
          {entry.product.name}
        </Typography>
        {status ? (
          <Typography variant="body-xs" weight="regular" color={colors.brown[700]} numberOfLines={1}>
            {status.hint}
          </Typography>
        ) : null}
      </View>
      <QuantityIndicator entry={entry} />
    </PressableWithHaptics>
  );
};

const PantryAisleGroup = ({ aisle }: { aisle: PantryAisle }) => {
  return (
    <ListLayoutView style={styles.aisle}>
      <AisleHeader type={aisle.aisle} />
      <ListLayoutView style={styles.aisleRows}>
        {aisle.entries.map((entry, index) => (
          <ListLayoutView key={entry.id}>
            {index > 0 ? <DashedDivider /> : null}
            <PantryRow entry={entry} />
          </ListLayoutView>
        ))}
      </ListLayoutView>
    </ListLayoutView>
  );
};

const EmptyPantry = ({ filter, search }: { filter: PantryFilter; search: string }) => {
  const isFiltering = search.trim().length > 0 || filter !== 'all';

  return (
    <EmptyState
      icon={Archive}
      title={isFiltering ? 'No pantry items found' : 'Nothing tracked yet'}
      description={
        isFiltering
          ? 'Try a different search or adjust your filters.'
          : 'Tap + to add stock manually, or check out product-backed grocery items.'
      }
    />
  );
};

const PantrySkeleton = () => {
  const insets = useSafeAreaInsets();

  return (
    <FlashList
      data={[1, 2, 3]}
      renderItem={() => (
        <View style={styles.skeletonAisle}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonLine, { width: '35%' }]} />
          </View>
          <View style={styles.skeletonRows}>
            <View style={styles.skeletonRow}>
              <View style={[styles.skeletonLine, { width: '55%' }]} />
              <View style={[styles.skeletonLine, { width: 52, height: 24 }]} />
            </View>
            <DashedDivider />
            <View style={styles.skeletonRow}>
              <View style={[styles.skeletonLine, { width: '45%' }]} />
              <View style={[styles.skeletonLine, { width: 52, height: 24 }]} />
            </View>
          </View>
        </View>
      )}
      style={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 76,
        paddingBottom: insets.bottom + 152,
      }}
      scrollEnabled={false}
    />
  );
};

const Pantry = () => {
  const listRef = useRef<FlashListRef<PantryAisle>>(null);
  useActiveTabPress(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
  const blurTarget = useRef<View | null>(null);
  const router = useRouter();
  const sheets = useSheets();
  const [filter, setFilter] = useState<PantryFilter>('all');
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const pantry = usePantry();
  const entries = useFilteredEntries(pantry.data, filter, search);
  const aisles = usePantryAisles(entries);
  const { isKeyboardOpen } = useKeyboardOpen();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const toolbarStyle = useAnimatedStyle(() => ({ bottom: Math.max(insets.bottom + 88, -keyboardHeight.value + 12) }));
  const tabFocusStyle = useTabFocusAnimation();


  const openFilterSheet = async () => {
    const nextFilter = await sheets.present('pantry-filter-sheet', { data: { current: filter } });
    if (nextFilter != null) setFilter(nextFilter);
  };

  return (
    <Animated.View style={[styles.screen, tabFocusStyle]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>
          <BlurTargetView ref={blurTarget} style={styles.screen}>
            {pantry.data == null ? (
              <PantrySkeleton />
            ) : (
              <AnimatedFlashList
                ref={listRef}
                data={aisles}
                renderItem={({ item }) => (
                  <PantryAisleGroup aisle={item} />
                )}
                keyExtractor={(item) => item.aisle}
                ListEmptyComponent={<EmptyPantry filter={filter} search={search} />}
                style={styles.list}
                ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                maintainVisibleContentPosition={{ disabled: true }}
                contentContainerStyle={{
                  ...(entries.length === 0 && { flexGrow: 1 }),
                  paddingHorizontal: 20,
                  paddingTop: insets.top + 76,
                  paddingBottom: insets.bottom + (entries.length === 0 ? 72 : 152),
                }}
              />
            )}
          </BlurTargetView>
          <RouteTitle
            blurTarget={blurTarget}
            icon={Archive}
            text="Pantry"
            rightSlot={
              <View style={styles.headerActions}>
                <PressableWithHaptics
                  accessibilityLabel="Open consumption history"
                  accessibilityRole="button"
                  hitSlop={20}
                  scaleTo={0.9}
                  onPress={() => router.push('/consumptions')}
                >
                  <History color={colors.brown[900]} strokeWidth={2.25} size={28} />
                </PressableWithHaptics>
                <PressableWithHaptics
                  accessibilityLabel="Open shopping items"
                  accessibilityRole="button"
                  hitSlop={20}
                  scaleTo={0.9}
                  onPress={() => router.push('/items')}
                >
                  <Boxes color={colors.brown[900]} strokeWidth={2.25} size={28} />
                </PressableWithHaptics>
              </View>
            }
          />
          {pantry.data != null ? (
            <Animated.View style={[styles.toolbar, toolbarStyle]}>
              <View style={styles.searchContainer}>
                <TextInput
                  variant="search"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search pantry..."
                  style={styles.searchInput}
                />
                {search.length > 0 ? (
                  <PressableWithHaptics
                    accessibilityLabel="Clear pantry search"
                    accessibilityRole="button"
                    onPress={() => setSearch('')}
                    scaleTo={0.85}
                    style={styles.clearSearch}
                  >
                    <X color={colors.brown[900]} size={20} strokeWidth={2.5} />
                  </PressableWithHaptics>
                ) : null}
              </View>
              <Button
                accessibilityLabel="Filter pantry"
                onPress={openFilterSheet}
                variant={filter !== 'all' ? 'primary' : 'outlined'}
                leftIcon={{ Icon: Funnel }}
                style={{ paddingHorizontal: 0, width: 48 }}
              />
              {isKeyboardOpen ? (
                <Button
                  accessibilityLabel="Close keyboard"
                  onPress={() => Keyboard.dismiss()}
                  variant="secondary"
                  leftIcon={{ Icon: Check }}
                />
              ) : (
                <Button
                  accessibilityLabel="Add pantry stock"
                  onPress={() => sheets.present('pantry-add-sheet')}
                  variant="primary"
                  leftIcon={{ Icon: Plus }}
                />
              )}
            </Animated.View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  list: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  toolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  searchInput: {
    color: colors.brown[900],
    paddingRight: 44,
    width: '100%',
  },
  searchContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  clearSearch: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    width: 40,
  },
  aisle: {
    gap: 12,
  },
  aisleRows: {
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  quantityPill: {
    minWidth: 40,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange[500],
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: colors.orange[600],
  },
  reminderIndicator: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonAisle: {
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonRows: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
  },
  skeletonRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEDBB9',
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
    backgroundColor: '#EEDBB9',
  },
});

export default Pantry;
