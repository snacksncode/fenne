import {
  AisleCategory,
  GroceryItemDTO,
  useDeleteGroceryItem,
  useEditGroceryItem,
  useGroceries,
  useGroceryCheckout,
} from '@/api/groceries';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button } from '@/components/button';
import { RouteTitle } from '@/components/RouteTitle';
import { Text } from '@/components/Text';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { CirclePlus, ListPlus, Pen, ShoppingBasket, Trash2, WandSparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  LinearTransition,
  SharedValue,
  useAnimatedProps,
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnUI } from 'react-native-worklets';
import { doNothing, entries, groupBy, isEmpty, map, sortBy } from 'remeda';
import { AisleHeader } from '@/components/aisle-header';
import { colors } from '@/constants/colors';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { SheetManager } from 'react-native-actions-sheet';

type AisleDTO = {
  aisle: AisleCategory;
  items: GroceryItemDTO[];
};

const EmptyList = () => {
  return (
    <Animated.View style={styles.container} entering={FadeIn}>
      <View style={styles.basket}>
        <ShoppingBasket size={48} color="#FEF7EA" strokeWidth={3} absoluteStrokeWidth />
      </View>
      <Text style={styles.heading}>Your grocery list is empty</Text>
      <Text style={styles.subheading}>
        Start planning your meals to fill it up,{'\n'}
        or add items directly.
      </Text>
      <View style={{ marginTop: 24, gap: 12 }}>
        <Button
          text="Add Your First Item"
          variant="outlined"
          leftIcon={{ Icon: CirclePlus }}
          onPress={() => SheetManager.show('grocery-item-sheet')}
        />
        <Button
          text="Auto-Generate from Menu"
          variant="primary"
          leftIcon={{ Icon: WandSparkles }}
          onPress={() => SheetManager.show('select-date-range-sheet')}
        />
      </View>
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

const AnimatedPath = Animated.createAnimatedComponent(Path);

const Checkbox = (props: { isChecked: boolean; progress: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(props.progress.value, [0, 0.5], ['#FEF2DD', '#F9974F']),
  }));

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: interpolate(props.progress.value, [0, 1], [24, 0]),
      opacity: interpolate(props.progress.value, [0, 0.1, 1], [0, 1, 1]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: 24,
          height: 24,
          borderRadius: 5,
          borderWidth: 1,
          borderBottomWidth: 2,
          borderColor: '#EC8032',
          backgroundColor: '#F9974F',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <AnimatedPath
          d="M4 12 9 17 20 6"
          stroke="#FEF7EA"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={24}
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

const unitFormatters: Record<Unit, (data: { count: number }) => string> = {
  count: () => '',
  g: () => ' g',
  kg: () => ' kg',
  ml: () => ' ml',
  l: () => ' l',
  fl_oz: () => ' fl oz',
  cup: ({ count }) => (count === 1 ? ' cup' : ' cups'),
  tbsp: () => ' tbsp',
  tsp: () => ' tsp',
  pt: ({ count }) => (count === 1 ? ' pt' : ' pts'),
  qt: ({ count }) => (count === 1 ? ' qt' : ' qts'),
  oz: () => ' oz',
  lb: () => ' lb',
};

const GroceryItem = ({ item: _item }: { item: GroceryItemDTO }) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const editGroceryItem = useEditGroceryItem();
  const deleteGroceryItem = useDeleteGroceryItem();
  const item = { ..._item, ...(editGroceryItem.isPending && editGroceryItem.variables) };
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isCompleted = item.status === 'completed';
  const progress = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isCompleted ? 1 : 0);
  }, [isCompleted, progress]);

  const vibrate = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const handlePress = () => {
    vibrate();
    editGroceryItem.mutate({ id: _item.id, status: item.status === 'pending' ? 'completed' : 'pending' });
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
          <Checkbox isChecked={isCompleted} progress={progress} />
        </Animated.View>
        <Animated.Text
          style={[{ flex: 1, fontFamily: 'Satoshi-Bold', fontSize: 16, lineHeight: 16 * 1.5 }, textStyles]}
        >
          {item.name}
        </Animated.Text>
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
            <Text
              style={{
                color: colors.cream[100],
                fontFamily: 'Satoshi-Bold',
                fontSize: 14,
              }}
            >
              {item.quantity}
              {unitFormatters[item.unit]({ count: item.quantity })}
            </Text>
          </View>
        )}
      </ReanimatedSwipeable>
    </AnimatedPressable>
  );
};

const GAP_SIZE = 24;

const Aisle = ({
  aisle: { aisle, items },
  enterAnimationsEnabled,
}: {
  aisle: AisleDTO;
  enterAnimationsEnabled: boolean;
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
          key={item.id}
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

const parseAisles = (groceries: GroceryItemDTO[]) => {
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

  const grouped = groupBy(groceries, (item) => item.aisle);
  const aisles = map(entries(grouped), ([aisle, items]) => ({ aisle, items }));
  return sortBy(aisles, ({ aisle }) => aisleOrder[aisle] ?? 999);
};

const PageContent = () => {
  const insets = useSafeAreaInsets();
  const groceries = useGroceries();
  const groceryCheckout = useGroceryCheckout();

  const [enterAnimationsEnabled, setEnterAnimationsEnabled] = useState(false);

  useEffect(() => {
    if (!groceries.data) return;
    const id = setTimeout(() => setEnterAnimationsEnabled(true), 500);
    return () => clearTimeout(id);
  }, [groceries.data]);

  if (!groceries.data) return <GroceriesSkeleton />;
  if (isEmpty(groceries.data)) return <EmptyList />;
  const hasAtLeastOneChecked = !!groceries.data.some((item) => item.status === 'completed');

  const aisles = parseAisles(groceries.data);

  const handleCheckout = () => groceryCheckout.mutate();

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <FlatList
        data={aisles}
        renderItem={({ item: aisle }) => (
          <Aisle aisle={aisle} enterAnimationsEnabled={enterAnimationsEnabled} />
        )}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => item.aisle}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          ...(isEmpty(groceries.data) && { flex: 1 }),
          paddingHorizontal: 20,
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + 152,
        }}
      />
      <LayoutAnimationConfig skipEntering>
        <View style={{ position: 'absolute', bottom: insets.bottom + 88, right: 16 }}>
          {hasAtLeastOneChecked ? (
            <Animated.View key="checkout" entering={SlideInRight.springify()} exiting={SlideOutRight.springify()}>
              <Button
                variant="secondary"
                onPress={handleCheckout}
                text={'Checkout!'}
                leftIcon={{ Icon: ShoppingBasket }}
              />
            </Animated.View>
          ) : (
            <Animated.View key="add" entering={SlideInRight.springify()} exiting={SlideOutRight.springify()}>
              <Button
                variant="primary"
                onPress={() => SheetManager.show('grocery-item-sheet')}
                text="What's Missing?"
                leftIcon={{ Icon: ListPlus }}
              />
            </Animated.View>
          )}
        </View>
      </LayoutAnimationConfig>
    </Animated.View>
  );
};

const Groceries = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      <RouteTitle text="Groceries" />
      <PageContent />
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
  heading: {
    fontFamily: 'Satoshi-Black',
    fontSize: 24,
    lineHeight: 24 * 1.5,
    color: '#4A3E36',
    marginTop: 10,
  },
  subheading: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 14 * 1.5,
    textAlign: 'center',
    color: '#4A3E36',
    marginTop: 4,
  },
  leftActionContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Groceries;
