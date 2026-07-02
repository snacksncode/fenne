import { usePantry } from '@/api/pantry';
import { PantryEntryDTO } from '@/api/types';
import { AisleIcon } from '@/components/aisle-header';
import { PantryFilter } from '@/components/bottomSheets/pantry-filter-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { RouteTitle } from '@/components/RouteTitle';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useTabFocusAnimation } from '@/hooks/use-tab-focus-animation';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';
import { useSheets } from '@/lib/sheet-context';
import { prettyUnit } from '@/utils/unit-formatters';
import { FlashList } from '@shopify/flash-list';
import { addDays, addMonths, addWeeks, parseISO } from 'date-fns';
import { Archive, Boxes, Check, Funnel, History, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const aisleLabels: Record<PantryEntryDTO['product']['aisle'], string> = {
  produce: 'Produce',
  bakery: 'Bakery',
  dairy_eggs: 'Dairy & Eggs',
  meat: 'Meat',
  seafood: 'Seafood',
  pantry: 'Pantry',
  frozen_foods: 'Frozen Foods',
  beverages: 'Beverages',
  snacks: 'Snacks',
  condiments_sauces: 'Condiments & Sauces',
  spices_baking: 'Spices & Baking',
  household: 'Household',
  personal_care: 'Personal Care',
  pet_supplies: 'Pet Supplies',
  other: 'Other',
};

const useFilteredEntries = (entries: PantryEntryDTO[] | undefined, filter: PantryFilter, search: string) => {
  return useMemo(() => {
    const pantryEntries = entries ?? [];
    const visible = pantryEntries.filter((entry) => !entry.product.is_kitchen_basic);
    const normalizedSearch = search.trim().toLocaleLowerCase();

    const filtered = visible.filter((entry) => {
      if (filter === 'tracked') return entry.product.shape === 'counted' || entry.product.shape === 'measured';
      if (filter === 'reminders') return entry.product.shape === 'timed';
      return true;
    });

    return filtered
      .filter((entry) => {
        if (!normalizedSearch) return true;

        return entry.product.name.toLocaleLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [entries, filter, search]);
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
  if (!acquiredAt || !target) return { label: '?', color: colors.brown[700], hint: 'Reminder date missing' };

  const now = new Date();
  const total = Math.max(1, target.getTime() - acquiredAt.getTime());
  const elapsed = now.getTime() - acquiredAt.getTime();
  const ratio = elapsed / total;
  const remainingDays = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);

  const label =
    remainingDays <= 0 ? 'Now' : remainingDays < 14 ? `${remainingDays}d` : `${Math.ceil(remainingDays / 7)}w`;
  const color = ratio >= 1 ? colors.red[500] : ratio >= 0.75 ? colors.orange[600] : colors.green[500];
  const hint = remainingDays <= 0 ? 'Running low' : `Bought ${Math.max(0, Math.ceil(elapsed / 86_400_000))}d ago`;

  return { label, color, hint };
};

const QuantityIndicator = ({ entry }: { entry: PantryEntryDTO }) => {
  if (entry.product.shape === 'timed') {
    const status = timedStatus(entry);

    return (
      <View style={[styles.timedIndicator, { borderColor: status.color }]}>
        <Typography variant="body-xs" weight="black" color={status.color} numberOfLines={1}>
          {status.label}
        </Typography>
      </View>
    );
  }

  const label =
    entry.product.shape === 'counted'
      ? `${entry.quantity_remaining}`
      : `${entry.quantity_remaining} ${prettyUnit({ quantity: entry.quantity_remaining, unit: entry.product.unit })}`;

  return (
    <View style={styles.quantityPill}>
      <Typography variant="body-sm" weight="bold" color={colors.brown[900]} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
};

const PantryRow = ({ entry }: { entry: PantryEntryDTO }) => {
  const sheets = useSheets();
  const status = entry.product.shape === 'timed' ? timedStatus(entry) : null;
  const secondary = status ? `${aisleLabels[entry.product.aisle]} · ${status.hint}` : aisleLabels[entry.product.aisle];

  return (
    <PressableWithHaptics
      style={styles.row}
      scaleTo={0.98}
      onPress={() => sheets.present('pantry-entry-sheet', { data: { entry } })}
    >
      <AisleIcon type={entry.product.aisle} />
      <View style={styles.rowText}>
        <Typography variant="body-lg" weight="bold" numberOfLines={1}>
          {entry.product.name}
        </Typography>
        <Typography variant="body-sm" weight="regular" color={colors.brown[700]} numberOfLines={1}>
          {secondary}
        </Typography>
      </View>
      <QuantityIndicator entry={entry} />
    </PressableWithHaptics>
  );
};

const EmptyPantry = ({ filter }: { filter: PantryFilter }) => (
  <Animated.View entering={FadeIn} style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Archive size={48} color={colors.cream[100]} strokeWidth={3} absoluteStrokeWidth />
    </View>
    <Typography variant="heading-md" weight="black" style={{ marginTop: 10, textAlign: 'center' }}>
      {filter === 'all' ? 'Nothing tracked yet' : 'Nothing here yet'}
    </Typography>
    <Typography variant="body-sm" weight="medium" color={colors.brown[700]} style={styles.emptyText}>
      {filter === 'all'
        ? 'Tap + to add stock manually, or check out product-backed grocery items.'
        : 'Switch filters or tap + to add tracked stock.'}
    </Typography>
  </Animated.View>
);

const PantrySkeleton = () => {
  const insets = useSafeAreaInsets();

  return (
    <FlashList
      data={[1, 2, 3, 4, 5]}
      renderItem={() => (
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '35%', height: 12 }]} />
          </View>
          <View style={[styles.skeletonLine, { width: 52, height: 32 }]} />
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
  const router = useRouter();
  const sheets = useSheets();
  const [filter, setFilter] = useState<PantryFilter>('all');
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const pantry = usePantry();
  const entries = useFilteredEntries(pantry.data, filter, search);
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
          <RouteTitle
            text="Pantry"
            rightSlot={
              <View style={styles.headerActions}>
                <PressableWithHaptics hitSlop={20} scaleTo={0.9} onPress={() => router.push('/consumptions')}>
                  <History color={colors.brown[900]} strokeWidth={2.25} size={28} />
                </PressableWithHaptics>
                <PressableWithHaptics hitSlop={20} scaleTo={0.9} onPress={() => router.push('/items')}>
                  <Boxes color={colors.brown[900]} strokeWidth={2.25} size={28} />
                </PressableWithHaptics>
              </View>
            }
          />
          {pantry.data == null ? (
            <PantrySkeleton />
          ) : (
            <FlashList
              data={entries}
              renderItem={({ item }) => <PantryRow entry={item} />}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<EmptyPantry filter={filter} />}
              style={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{
                ...(entries.length === 0 && { flexGrow: 1 }),
                paddingHorizontal: 20,
                paddingTop: insets.top + 76,
                paddingBottom: insets.bottom + 152,
              }}
            />
          )}
          {pantry.data != null ? (
            <Animated.View style={[styles.toolbar, toolbarStyle]}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search pantry..."
                style={styles.searchInput}
              />
              <Button
                onPress={openFilterSheet}
                variant={filter !== 'all' ? 'primary' : 'outlined'}
                leftIcon={{ Icon: Funnel }}
                style={{ paddingHorizontal: 0, width: 48 }}
              />
              {isKeyboardOpen ? (
                <Button onPress={() => Keyboard.dismiss()} variant="secondary" leftIcon={{ Icon: Check }} />
              ) : (
                <Button
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
    flex: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
    color: colors.brown[900],
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  quantityPill: {
    minWidth: 48,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[100],
    borderWidth: 1,
    borderColor: colors.brown[900],
  },
  timedIndicator: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[100],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    backgroundColor: colors.brown[900],
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 4,
  },
  skeletonRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
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
