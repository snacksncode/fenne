import { ListLayoutView } from '@/components/list-layout-view';
import { AnimatedFlashList } from '@/components/animated-flash-list';
import { useActiveTabPress } from '@/hooks/use-active-tab-press';
import { BlurTargetView } from 'expo-blur';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import {
  useDeleteGroceryItem,
  useGroceries,
  useGroceryCheckout,
} from '@/api/groceries';
import { AisleCategory, GroceryItemDTO } from '@/api/types';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { DashedDivider } from '@/components/dashed-divider';
import { EmptyState } from '@/components/empty-state';
import { RouteTitle } from '@/components/RouteTitle';
import { Typography } from '@/components/Typography';
import * as Haptics from 'expo-haptics';
import { CirclePlus, CookingPot, ListPlus, Plus, ShoppingBasket, WandSparkles } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { GroceryQuantity } from '@/components/grocery-quantity';
import { GrocerySwipeActions } from '@/components/grocery-swipe-actions';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  FadeOut,
  FadeIn,
  SlideInRight,
  SlideOutRight,
  LayoutAnimationConfig,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { entries, groupBy, isEmpty, map, pipe, sortBy } from 'remeda';
import { AisleHeader } from '@/components/aisle-header';
import { colors } from '@/constants/colors';
import { useSheets } from '@/lib/sheet-context';
import { useTabFocusAnimation } from '@/hooks/use-tab-focus-animation';
import { useGroceryChecks } from '@/hooks/use-grocery-checks';

type AisleDTO = {
  aisle: AisleCategory;
  items: GroceryItemDTO[];
};

type ListItem = ({ type: 'aisle' } & AisleDTO) | { type: 'separator' } | ({ type: 'bought-aisle' } & AisleDTO);

const EmptyList = () => {
  return (
    <EmptyState
      icon={ShoppingBasket}
      title="Your grocery list is empty"
      description={'Start planning your meals to fill it up,\nor add items directly.'}
    />
  );
};

const usePulseAnimation = () => {
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, [opacity]);

  return opacity;
};

const GroceryItemSkeleton = ({ showDivider = false }: { showDivider?: boolean }) => {
  const opacity = usePulseAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <>
      {showDivider ? <DashedDivider /> : null}
      <Animated.View style={[styles.groceryRow, animatedStyle]}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            backgroundColor: '#E8DCC8',
          }}
        />
        <View style={{ flex: 1, gap: 8 }}>
          <View
            style={{
              height: 16,
              borderRadius: 4,
              backgroundColor: '#E8DCC8',
              width: '70%',
            }}
          />
        </View>
      </Animated.View>
    </>
  );
};

const AisleSkeleton = () => {
  const opacity = usePulseAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ gap: 12 }, animatedStyle]}>
      <View style={{ gap: 8, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            padding: 4,
            backgroundColor: colors.orange[100],
            borderRadius: 8,
            width: 32,
            height: 32,
          }}
        />
        <View
          style={{
            height: 20,
            borderRadius: 4,
            backgroundColor: '#E8DCC8',
            width: '40%',
          }}
        />
      </View>
      <View
        style={{
          backgroundColor: '#FEF2DD',
          borderWidth: 1,
          borderBottomWidth: 2,
          borderColor: '#4A3E36',
          borderRadius: 8,
        }}
      >
        {[1, 2, 3].map((i, index) => (
          <GroceryItemSkeleton key={i} showDivider={index > 0} />
        ))}
      </View>
    </Animated.View>
  );
};

const GroceriesSkeleton = () => {
  const insets = useSafeAreaInsets();
  return (
    <FlashList
      maintainVisibleContentPosition={{ disabled: true }}
      data={[1, 2, 3]}
      renderItem={() => <AisleSkeleton />}
      style={{ backgroundColor: '#FEF7EA', flex: 1 }}
      keyExtractor={(_, i) => i.toString()}
      ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 76,
        paddingBottom: insets.bottom + 152,
      }}
      scrollEnabled={false}
    />
  );
};

type GroceryChecks = ReturnType<typeof useGroceryChecks>;

const GroceryItem = ({ item, checks }: { item: GroceryItemDTO; checks: GroceryChecks }) => {
  const sheets = useSheets();
  const swipeRef = useRef<SwipeableMethods>(null);
  const remove = useDeleteGroceryItem();
  const completed = (checks.checks[item.id]?.status ?? item.status) === 'completed';
  const { progress } = useCheckbox(completed);
  const busy = checks.isSaving(item.id) || remove.isPending;
  const openEdit = () => {
    if (checks.checks[item.id]) return;
    swipeRef.current?.close();
    sheets.present('grocery-entry-sheet', { data: { grocery: item } });
  };
  const removeItem = () => {
    swipeRef.current?.close();
    checks.cancel(item.id);
    remove.mutate({ id: item.id });
  };
  const toggle = () => checks.toggle(item);

  return (
    <View>
      <ReanimatedSwipeable ref={swipeRef} enabled={!busy} friction={1.5} rightThreshold={35}
        overshootLeft={false} overshootRight overshootFriction={8}
        renderRightActions={(swipeProgress) => (
          <GrocerySwipeActions progress={swipeProgress} name={item.name} onEdit={openEdit} onRemove={removeItem} disabled={busy} />
        )}>
        <Pressable onLongPress={openEdit} disabled={busy} style={styles.groceryRow} accessible={false}>
          <PressableWithHaptics onPress={toggle} onLongPress={openEdit}
            accessibilityRole="checkbox" accessibilityLabel={`Bought ${item.name}`}
            accessibilityState={{ checked: completed, disabled: busy || (!completed && item.quantity === 0) }}
            disabled={busy || (!completed && item.quantity === 0)} hitSlop={8}>
            <Checkbox progress={progress} />
          </PressableWithHaptics>
          <View style={{ flex: 1 }} accessible accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`}
            accessibilityActions={[{ name: 'activate', label: 'Edit item' }]} onAccessibilityAction={openEdit}>
            <Typography variant="body-base" weight="bold" numberOfLines={1}
              style={{ color: completed ? colors.brown[600] : colors.brown[900] }}>
              {item.name}
            </Typography>
          </View>
          {!(item.quantity === 1 && item.unit === 'count') && <GroceryQuantity quantity={item.quantity} unit={item.unit} />}
        </Pressable>
      </ReanimatedSwipeable>
      {remove.isError && <Typography variant="body-xs" weight="medium" color={colors.red[600]} style={{ padding: 12 }}>
        Could not remove this item. Try again.
      </Typography>}
    </View>
  );
};

const GAP_SIZE = 24;

const CompletedSeparator = () => (
  <ListLayoutView
    style={{ position: 'relative', zIndex: -1, alignItems: 'center', gap: 8 }}
  >
    <ListLayoutView
      style={{
        borderBottomWidth: 1,
        borderColor: '#867a6e',
        borderStyle: 'dashed',
        left: 0,
        position: 'absolute',
        right: 0,
        top: '50%',
        width: '100%',
      }}
    />
    <Typography
      style={{ backgroundColor: colors.cream[100], paddingHorizontal: 4 }}
      variant="body-sm"
      weight="medium"
      color="#867a6e"
    >
      Completed
    </Typography>
  </ListLayoutView>
);

const Aisle = ({
  aisle: { aisle, items },
  isBought = false,
  checks,
}: {
  aisle: AisleDTO;
  isBought?: boolean;
  checks: GroceryChecks;
}) => (
  <ListLayoutView style={{ gap: 12 }}>
    <AisleHeader type={aisle} />
    <ListLayoutView
      style={{
        backgroundColor: colors.surface.raised,
        padding: 1,
        paddingBottom: 2,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => (
        <ListLayoutView key={isBought ? `${item.id}-bought` : item.id}>
          {index > 0 ? <DashedDivider /> : null}
          <GroceryItem key={item.id} item={item} checks={checks} />
        </ListLayoutView>
      ))}
      <ListLayoutView pointerEvents="none" style={[StyleSheet.absoluteFill, {
        borderWidth: 1, borderBottomWidth: 2, borderColor: colors.brown[900], borderRadius: 8,
      }]} />
    </ListLayoutView>
  </ListLayoutView>
);

const parseAisles = (groceries: GroceryItemDTO[]): ListItem[] => {
  const aisleOrder: Record<AisleCategory, number> = {
    produce: 0,
    bakery: 1,
    dairy_eggs: 2,
    meat: 3,
    seafood: 4,
    pantry: 5,
    frozen_foods: 6,
    beverages: 7,
    snacks: 8,
    condiments_sauces: 9,
    spices_baking: 10,
    household: 11,
    personal_care: 12,
    pet_supplies: 13,
    other: 14,
  };

  const pending = groceries.filter((i) => i.status === 'pending');
  const completed = groceries.filter((i) => i.status === 'completed');

  const processGroceries = (groceries: GroceryItemDTO[], type: 'aisle' | 'bought-aisle' = 'aisle'): ListItem[] => {
    return pipe(
      groceries,
      groupBy((i) => i.aisle),
      entries(),
      map(([aisle, items]) => ({ type, aisle, items }) as ListItem),
      sortBy((item) => ('aisle' in item ? (aisleOrder[item.aisle] ?? 999) : 999))
    );
  };

  const pendingAisles = processGroceries(pending);
  const completedAisles = processGroceries(completed, 'bought-aisle');

  if (completedAisles.length === 0) return pendingAisles;
  if (pendingAisles.length === 0) return completedAisles;
  return [...pendingAisles, { type: 'separator' }, ...completedAisles];
};

const PageContent = ({ isExpanded, setIsExpanded }: { isExpanded: boolean; setIsExpanded: (v: boolean) => void }) => {
  const listRef = useRef<FlashListRef<ListItem>>(null);
  useActiveTabPress(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
  const insets = useSafeAreaInsets();
  const sheets = useSheets();
  const groceries = useGroceries();
  const checks = useGroceryChecks();
  const { flush } = checks;
  useFocusEffect(useCallback(() => () => { void flush(); }, [flush]));
  const { refetch } = groceries;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const groceryCheckout = useGroceryCheckout();


  const expand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(true);
  };

  const swipeUp = Gesture.Fling()
    .direction(Directions.UP)
    .onEnd(() => scheduleOnRN(expand));

  if (!groceries.data) return <GroceriesSkeleton />;
  const hasAtLeastOneChecked = groceries.data.some((item) => item.status === 'completed');
  const aisles = parseAisles(groceries.data);

  const handleCheckout = () => {
    if (!checks.hasPending) groceryCheckout.mutate();
  };

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <AnimatedFlashList
        ref={listRef}
        maintainVisibleContentPosition={{ disabled: true }}
        data={aisles}
        getItemType={(item) => item.type}
        ListEmptyComponent={EmptyList}
        ListHeaderComponent={checks.error ? (
          <Typography variant="body-xs" weight="medium" color={colors.red[600]} style={{ paddingBottom: 12 }}>
            Could not save some checked items. Please try again.
          </Typography>
        ) : null}
        renderItem={({ item }) => {
          if (item.type === 'separator') {
            return <CompletedSeparator />;
          }
          if (item.type === 'bought-aisle') {
            return <Aisle aisle={item} isBought checks={checks} />;
          }
          return <Aisle aisle={item} checks={checks} />;
        }}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) =>
          item.type === 'aisle' ? item.aisle : item.type === 'bought-aisle' ? `${item.aisle}-bought` : 'separator'
        }
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          ...(isEmpty(aisles) && { flexGrow: 1 }),
          paddingHorizontal: 20,
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + (isEmpty(aisles) ? 72 : 152),
        }}
      />
      {isExpanded && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(254, 247, 234, 0.85)' }}
            onPress={() => setIsExpanded(false)}
          />
        </Animated.View>
      )}
      <LayoutAnimationConfig skipEntering>
        <View style={{ position: 'absolute', bottom: insets.bottom + 88, right: 16, flexDirection: 'row', gap: 8 }}>
          {hasAtLeastOneChecked ? (
            <Animated.View
              key="checkout"
              style={{ flexDirection: 'row', gap: 8 }}
              entering={SlideInRight.springify()}
              exiting={SlideOutRight.springify()}
            >
              <Button
                accessibilityLabel="Add grocery item"
                variant="outlined"
                onPress={() => sheets.present('grocery-item-sheet')}
                leftIcon={{ Icon: CirclePlus }}
                style={{ paddingHorizontal: 0, width: 48 }}
              />
              <Button
                variant="secondary"
                onPress={handleCheckout}
                text="Checkout!"
                disabled={groceryCheckout.isPending || checks.hasPending}
                isLoading={groceryCheckout.isPending}
                leftIcon={{ Icon: ShoppingBasket }}
              />
            </Animated.View>
          ) : isExpanded ? (
            <Animated.View
              key="expanded"
              style={{ gap: 8, alignItems: 'flex-end' }}
              exiting={SlideOutRight.springify()}
            >
              <Animated.View entering={FadeInDown.springify().delay(100)}>
                <Button
                  variant="outlined"
                  onPress={() => {
                    setIsExpanded(false);
                    sheets.present('add-from-recipe-sheet');
                  }}
                  text="Add from Recipe"
                  leftIcon={{ Icon: CookingPot }}
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.springify().delay(50)}>
                <Button
                  variant="outlined"
                  onPress={() => {
                    setIsExpanded(false);
                    sheets.present('select-date-range-sheet');
                  }}
                  text="Generate from Menu"
                  leftIcon={{ Icon: WandSparkles }}
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.springify()}>
                <Button
                  variant="primary"
                  onPress={() => {
                    setIsExpanded(false);
                    sheets.present('grocery-item-sheet');
                  }}
                  text="What's missing?"
                  leftIcon={{ Icon: ListPlus }}
                />
              </Animated.View>
            </Animated.View>
          ) : (
            <GestureDetector gesture={swipeUp}>
              <Animated.View
                key="add"
                style={{ flexDirection: 'row', gap: 8 }}
                entering={SlideInRight.springify()}
                exiting={SlideOutRight.springify()}
              >
                <Button
                  accessibilityLabel="Open grocery actions"
                  variant="primary"
                  onPress={() => setIsExpanded(true)}
                  leftIcon={{ Icon: Plus }}
                />
              </Animated.View>
            </GestureDetector>
          )}
        </View>
      </LayoutAnimationConfig>
    </Animated.View>
  );
};

const Groceries = () => {
  const blurTarget = useRef<View | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const tabFocusStyle = useTabFocusAnimation();
  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#FEF7EA' }, tabFocusStyle]}>
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        <PageContent isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </BlurTargetView>
      <RouteTitle blurTarget={blurTarget} icon={ShoppingBasket} text="Groceries" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  groceryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface.raised,
  },
});

export default Groceries;
