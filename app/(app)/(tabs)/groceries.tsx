import {
  AisleCategory,
  GroceryItemDTO,
  useDeleteGroceryItem,
  useEditGroceryItem,
  useGroceries,
  useGroceryCheckout,
} from '@/api/groceries';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { RouteTitle } from '@/components/RouteTitle';
import { Typography } from '@/components/Typography';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { CirclePlus, CookingPot, ListPlus, Pen, Plus, ShoppingBasket, Trash2, WandSparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  LinearTransition,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  FadeOut,
  FadeIn,
  SlideInRight,
  SlideOutRight,
  LayoutAnimationConfig,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnUI, scheduleOnRN } from 'react-native-worklets';
import { doNothing, entries, groupBy, isEmpty, map, pipe, sortBy } from 'remeda';
import { AisleHeader } from '@/components/aisle-header';
import { colors } from '@/constants/colors';
import { SheetManager } from 'react-native-actions-sheet';

type AisleDTO = {
  aisle: AisleCategory;
  items: GroceryItemDTO[];
};

type ListItem = ({ type: 'aisle' } & AisleDTO) | { type: 'separator' } | ({ type: 'bought-aisle' } & AisleDTO);

const EmptyList = () => {
  return (
    <Animated.View style={styles.container} entering={FadeIn}>
      <View style={styles.basket}>
        <ShoppingBasket size={48} color="#FEF7EA" strokeWidth={3} absoluteStrokeWidth />
      </View>
      <Typography variant="heading-md" weight="black" style={{ marginTop: 10 }}>
        Your grocery list is empty
      </Typography>
      <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center', marginTop: 4 }}>
        Start planning your meals to fill it up,{'\n'}
        or add items directly.
      </Typography>
    </Animated.View>
  );
};

const usePulseAnimation = () => {
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, [opacity]);

  return opacity;
};

const GroceryItemSkeleton = () => {
  const opacity = usePulseAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
        animatedStyle,
      ]}
    >
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
          paddingVertical: 4,
        }}
      >
        {[1, 2, 3].map((i) => (
          <GroceryItemSkeleton key={i} />
        ))}
      </View>
    </Animated.View>
  );
};

const GroceriesSkeleton = () => {
  const insets = useSafeAreaInsets();
  return (
    <FlashList
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTypography = Animated.createAnimatedComponent(Typography);

const RightActions = (props: { progress: SharedValue<number>; onEdit: () => void; onRemove: () => void }) => {
  const [width, setWidth] = useState(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(props.progress.value, [0, 1], [width, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.leftActionContainer, animatedStyle]}
    >
      <Button size="small" variant="outlined" onPress={props.onEdit} text="Edit" leftIcon={{ Icon: Pen }} />
      <Button size="small" variant="secondary" onPress={props.onRemove} text="Remove" leftIcon={{ Icon: Trash2 }} />
    </Animated.View>
  );
};

const GroceryItem = ({ item: _item }: { item: GroceryItemDTO }) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const editGroceryItem = useEditGroceryItem();
  const deleteGroceryItem = useDeleteGroceryItem();
  const item = { ..._item, ...(editGroceryItem.isPending && editGroceryItem.variables) };
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isCompleted = item.status === 'completed';
  const { progress } = useCheckbox(isCompleted);

  const vibrate = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const handlePress = () => {
    vibrate();
    progress.value = withSpring(isCompleted ? 0 : 1);
    setTimeout(() => {
      editGroceryItem.mutate({
        id: _item.id,
        status: item.status === 'pending' ? 'completed' : 'pending',
      });
    }, 500);
  };

  const closeSwipeable = () => swipeRef.current?.close();
  const handleEdit = () => {
    closeSwipeable();
    SheetManager.show('grocery-item-sheet', { payload: { grocery: _item } });
  };
  const onRemove = () => {
    deleteGroceryItem.mutate({ id: _item.id });
  };

  const textStyles = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ['#4A3E36', '#867a6e']),
  }));

  return (
    <AnimatedPressable
      onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(0.9)))}
      onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
      onPress={handlePress}
      onLongPress={handleEdit}
    >
      <ReanimatedSwipeable
        ref={swipeRef}
        friction={1.5}
        rightThreshold={20}
        renderRightActions={(progress) => <RightActions progress={progress} onEdit={handleEdit} onRemove={onRemove} />}
        childrenContainerStyle={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          alignItems: 'flex-start',
        }}
      >
        <Animated.View style={scaleStyle}>
          <Checkbox progress={progress} />
        </Animated.View>
        <AnimatedTypography variant="body-base" weight="bold" style={[{ flex: 1 }, textStyles]}>
          {item.name}
        </AnimatedTypography>
        {!(item.quantity === 1 && item.unit === 'count') && (
          <View
            style={{
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 6,
              backgroundColor: colors.orange[500],
              borderWidth: 2,
              borderBottomWidth: 3,
              borderColor: colors.orange[600],
            }}
          >
            <Typography variant="body-sm" weight="bold" color={colors.cream[100]}>
              {item.quantity} {item.unit}
            </Typography>
          </View>
        )}
      </ReanimatedSwipeable>
    </AnimatedPressable>
  );
};

const GAP_SIZE = 24;

const CompletedSeparator = () => (
  <Animated.View
    entering={FadeIn}
    exiting={FadeOut}
    layout={LinearTransition.springify()}
    style={{ position: 'relative', zIndex: -1, alignItems: 'center', gap: 8 }}
  >
    <View
      style={{
        top: '50%',
        left: 0,
        right: 0,
        position: 'absolute',
        width: '100%',
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#867a6e',
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
  </Animated.View>
);

const Aisle = ({
  aisle: { aisle, items },
  enterAnimationsEnabled,
  isBought = false,
}: {
  aisle: AisleDTO;
  enterAnimationsEnabled: boolean;
  isBought?: boolean;
}) => (
  <Animated.View
    style={{ gap: 12 }}
    layout={LinearTransition.springify()}
    exiting={FadeOut}
    {...(enterAnimationsEnabled && { entering: FadeIn })}
  >
    <AisleHeader type={aisle} />
    <Animated.View
      style={{
        backgroundColor: '#FEF2DD',
        borderWidth: 1,
        borderBottomWidth: 2,
        borderColor: '#4A3E36',
        borderRadius: 8,
        paddingVertical: 4,
        overflow: 'hidden',
      }}
      layout={LinearTransition.springify()}
    >
      {items.map((item) => (
        <Animated.View
          key={isBought ? `${item.id}-bought` : item.id}
          layout={LinearTransition.springify()}
          exiting={FadeOut}
          {...(enterAnimationsEnabled && { entering: FadeIn })}
        >
          <GroceryItem key={item.id} item={item} />
        </Animated.View>
      ))}
    </Animated.View>
  </Animated.View>
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
  const insets = useSafeAreaInsets();
  const groceries = useGroceries();
  const groceryCheckout = useGroceryCheckout();

  const [enterAnimationsEnabled, setEnterAnimationsEnabled] = useState(false);

  useEffect(() => {
    if (!groceries.data) return;
    const id = setTimeout(() => setEnterAnimationsEnabled(true), 500);
    return () => {
      setEnterAnimationsEnabled(false);
      clearTimeout(id);
    };
  }, [groceries.data]);

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

  const handleCheckout = () => groceryCheckout.mutate();

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <FlatList
        data={aisles}
        ListEmptyComponent={EmptyList}
        renderItem={({ item }) => {
          if (item.type === 'separator') {
            return <CompletedSeparator />;
          }
          if (item.type === 'bought-aisle') {
            return <Aisle aisle={item} isBought enterAnimationsEnabled={enterAnimationsEnabled} />;
          }
          return <Aisle aisle={item} enterAnimationsEnabled={enterAnimationsEnabled} />;
        }}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) =>
          item.type === 'aisle' ? item.aisle : item.type === 'bought-aisle' ? `${item.aisle}-bought` : 'separator'
        }
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          ...(isEmpty(groceries.data) && { flex: 1 }),
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
                variant="outlined"
                onPress={() => SheetManager.show('grocery-item-sheet')}
                leftIcon={{ Icon: CirclePlus }}
                style={{ paddingHorizontal: 0, width: 48 }}
              />
              <Button
                variant="secondary"
                onPress={handleCheckout}
                text="Checkout!"
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
                    SheetManager.show('add-from-recipe-sheet');
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
                    SheetManager.show('select-date-range-sheet');
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
                    SheetManager.show('grocery-item-sheet');
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
                <Button variant="primary" onPress={() => setIsExpanded(true)} leftIcon={{ Icon: Plus }} />
              </Animated.View>
            </GestureDetector>
          )}
        </View>
      </LayoutAnimationConfig>
    </Animated.View>
  );
};

const Groceries = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      <RouteTitle text="Groceries" />
      <PageContent isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  basket: {
    backgroundColor: '#493D34',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
  },

  leftActionContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
});

export default Groceries;
