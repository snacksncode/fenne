import { EditGroceryItemSheet, EditGroceryItemSheetData } from '@/components/bottomSheets/edit-grocery-item-sheet';
import { nanoid } from 'nanoid/non-secure';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Button } from '@/components/button';
import { RouteTitle } from '@/components/RouteTitle';
import { Plus } from '@/components/svgs/plus';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ShoppingBasket, WandSparkles } from 'lucide-react-native';
import { RefObject, useEffect, useRef, useState } from 'react';
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnUI } from 'react-native-worklets';
import { doNothing, entries, groupBy, isEmpty, map, pipe, sort, sortBy } from 'remeda';
import {
  NewGroceryItemSheet,
  SelectCategorySheet,
  SelectCategorySheetData,
} from '@/components/bottomSheets/new-grocery-item-sheet';
import { AisleCategory, AisleHeader } from '@/components/aisle-header';
import { toSorted } from '@/eslint.config';
import useTimeout from '@/hooks/use-timeout';

export type GroceryItemDTO = {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  aisle: AisleCategory;
};

let groceries: GroceryItemDTO[] = [
  { id: 'a1b2c3d4e5f6g7h8i9j0', name: 'Bananas', status: 'pending', aisle: 'produce' },
  { id: '7g_ZVfXTOkuOAVtXq2v7', name: 'Oranges', status: 'pending', aisle: 'produce' },
  { id: 'R1S2T3U4V5W6X7Y8Z9A0', name: 'Large Eggs', status: 'pending', aisle: 'dairy_eggs' },
  { id: 'K2L3M4N5O6P7Q8R9S0T1', name: 'Whole Wheat Bread', status: 'pending', aisle: 'bakery' },
  { id: 'x7y8z9A0B1C2D3E4F5G6', name: 'Croissants', status: 'pending', aisle: 'bakery' },
  { id: 'H7I8J9K0L1M2N3O4P5Q6', name: 'Milk (2%)', status: 'pending', aisle: 'dairy_eggs' },
  { id: 'B2C3D4E5F6G7H8I9J0K1', name: 'Cheddar Cheese', status: 'pending', aisle: 'dairy_eggs' },
  { id: 'L3M4N5O6P7Q8R9S0T1U2', name: 'Chicken Breasts', status: 'pending', aisle: 'meat' },
  { id: 'V4W5X6Y7Z8A9B0C1D2E3', name: 'Ground Beef (80/20)', status: 'pending', aisle: 'meat' },
  { id: 'F5G6H7I8J9K0L1M2N3O4', name: 'Salmon Fillets', status: 'pending', aisle: 'seafood' },
  { id: 'P6Q7R8S9T0U1V2W3X4Y5', name: 'Shrimp', status: 'pending', aisle: 'seafood' },
  { id: 'Z7A8B9C0D1E2F3G4H5I6', name: 'Pasta (Spaghetti)', status: 'pending', aisle: 'pantry' },
  { id: 'J8K9L0M1N2O3P4Q5R6S7', name: 'Olive Oil', status: 'pending', aisle: 'pantry' },
  { id: 'T9U0V1W2X3Y4Z5A6B7C8', name: 'Canned Tomatoes', status: 'pending', aisle: 'pantry' },
  { id: 'D0E1F2G3H4I5J6K7L8M9', name: 'Frozen Peas', status: 'pending', aisle: 'frozen_foods' },
  { id: 'N1O2P3Q4R5S6T7U8V9W0', name: 'Ice Cream (Vanilla)', status: 'pending', aisle: 'frozen_foods' },
  { id: 'X2Y3Z4A5B6C7D8E9F0G1', name: 'Orange Juice', status: 'pending', aisle: 'beverages' },
  { id: 'H3I4J5K6L7M8N9O0P1Q2', name: 'Coffee (Ground)', status: 'pending', aisle: 'beverages' },
  { id: 'R4S5T6U7V8W9X0Y1Z2A3', name: 'Potato Chips', status: 'pending', aisle: 'snacks' },
  { id: 'B5C6D7E8F9G0H1I2J3K4', name: 'Granola Bars', status: 'pending', aisle: 'snacks' },
  { id: 'L6M7N8O9P0Q1R2S3T4U5', name: 'Ketchup', status: 'pending', aisle: 'condiments_sauces' },
  { id: 'V7W8X9Y0Z1A2B3C4D5E6', name: 'Mayonnaise', status: 'pending', aisle: 'condiments_sauces' },
  { id: 'F8G9H0I1J2K3L4M5N6O7', name: 'Salt', status: 'pending', aisle: 'spices_baking' },
  { id: 'P9Q0R1S2T3U4V5W6X7Y8', name: 'Black Pepper', status: 'pending', aisle: 'spices_baking' },
  { id: 'Z0A1B2C3D4E5F6G7H8I9', name: 'Dish Soap', status: 'pending', aisle: 'household' },
  { id: 'J1K2L3M4N5O6P7Q8R9S0', name: 'Paper Towels', status: 'pending', aisle: 'household' },
  { id: 'T2U3V4W5X6Y7Z8A9B0C1', name: 'Toothpaste', status: 'pending', aisle: 'personal_care' },
  { id: 'D3E4F5G6H7I8J9K0L1M2', name: 'Shampoo', status: 'pending', aisle: 'personal_care' },
  { id: 'N4O5P6Q7R8S9T0U1V2W3', name: 'Dog Food', status: 'pending', aisle: 'pet_supplies' },
  { id: 'X5Y6Z7A8B9C0D1E2F3G4', name: 'Cat Litter', status: 'pending', aisle: 'pet_supplies' },
  { id: 'H6I7J8K9L0M1N2O3P4Q5', name: 'Batteries (AA)', status: 'pending', aisle: 'other' },
  { id: 'R7S8T9U0V1W2X3Y4Z5A6', name: 'Light Bulbs', status: 'pending', aisle: 'other' },
];

type AisleDTO = {
  aisle: AisleCategory;
  items: GroceryItemDTO[];
};

const EmptyList = ({ sheets }: { sheets: Sheets }) => (
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
        leftIcon={{ Icon: Plus }}
        onPress={() => sheets.newGroceryItemSheetRef.current?.present()}
      />
      <Button text="Auto-Generate from Menu" variant="primary" leftIcon={{ Icon: WandSparkles }} onPress={() => {}} />
    </View>
  </Animated.View>
);

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
            backgroundColor: '#F5D2BB',
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
      opacity: interpolate(props.progress.value, [0, 0.1], [0, 1]),
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
      <Button size="small" variant="outlined" onPress={props.onEdit} text="Edit" />
      <Button size="small" variant="secondary" onPress={props.onRemove} text="Remove" />
    </Animated.View>
  );
};

const GroceryItem = ({ item: _item, sheets }: { item: GroceryItemDTO; sheets: Sheets }) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const editGroceryItem = useEditGroceryItem({ id: _item.id });
  const deleteGroceryItem = useDeleteGroceryItem({ id: _item.id });
  const item = { ..._item, ...editGroceryItem.variables };
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
    editGroceryItem.mutate({ status: item.status === 'pending' ? 'completed' : 'pending' });
  };

  const closeSwipeable = () => swipeRef.current?.close();
  const handleEdit = () => {
    closeSwipeable();
    sheets.editGroceryItemSheetRef.current?.present({ item });
  };
  const onRemove = () => {
    deleteGroceryItem.mutate();
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
        }}
      >
        <Animated.View style={scaleStyle}>
          <Checkbox isChecked={isCompleted} progress={progress} />
        </Animated.View>
        <Animated.Text style={[{ fontFamily: 'Satoshi-Bold', fontSize: 16, lineHeight: 16 * 1.5 }, textStyles]}>
          {item.name}
        </Animated.Text>
      </ReanimatedSwipeable>
    </AnimatedPressable>
  );
};

const GAP_SIZE = 24;

const Aisle = ({
  aisle: { aisle, items },
  sheets,
  enterAnimationsEnabled,
}: {
  aisle: AisleDTO;
  sheets: Sheets;
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
          <GroceryItem key={item.id} item={item} sheets={sheets} />
        </Animated.View>
      ))}
    </Animated.View>
  </Animated.View>
);

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const groceriesOptions = queryOptions({
  queryKey: ['groceries'] as const,
  queryFn: async () => {
    await wait(1000);
    return groceries;
  },
});

const useGroceries = () => {
  return useQuery(groceriesOptions);
};

const useEditGroceryItem = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editGroceryItem'],
    mutationFn: async (newItemData: Omit<Partial<GroceryItemDTO>, 'id'>) => {
      await wait(500);
      groceries = groceries.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...newItemData };
      });
    },
    onMutate: async (newItemData) => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => {
        return prev?.map((item) => {
          if (item.id !== id) return item;
          return { ...item, ...newItemData };
        });
      });
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

const useAddGroceryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addGroceryItem'],
    mutationFn: async (newItemData: Omit<GroceryItemDTO, 'id'>) => {
      await wait(500);
      groceries = [...groceries, { ...newItemData, id: nanoid() }];
    },
    onMutate: async (newItemData) => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => {
        return [...(prev ?? []), { ...newItemData, id: nanoid() }];
      });
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

const useDeleteGroceryItem = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteGroceryItem'],
    mutationFn: async () => {
      await wait(500);
      groceries = groceries.filter((item) => item.id !== id);
    },
    onMutate: async () => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => prev?.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

const useGroceryCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['checkout'],
    mutationFn: async () => {
      await wait(500);
      groceries = groceries.filter((item) => item.status !== 'completed');
    },
    onMutate: async () => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => {
        return prev?.filter((item) => item.status !== 'completed');
      });
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

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

const PageContent = ({ sheets }: { sheets: Sheets }) => {
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
  if (isEmpty(groceries.data)) return <EmptyList sheets={sheets} />;
  const hasAtLeastOneChecked = !!groceries.data.some((item) => item.status === 'completed');

  const aisles = parseAisles(groceries.data);

  const handleCheckout = () => groceryCheckout.mutate();

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <FlatList
        data={aisles}
        renderItem={({ item: aisle }) => (
          <Aisle aisle={aisle} sheets={sheets} enterAnimationsEnabled={enterAnimationsEnabled} />
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
      <Button
        variant="primary"
        onPress={hasAtLeastOneChecked ? handleCheckout : () => sheets.newGroceryItemSheetRef.current?.present()}
        text={hasAtLeastOneChecked ? 'Checkout Time!' : "What's Missing?"}
        leftIcon={{ Icon: hasAtLeastOneChecked ? ShoppingBasket : Plus }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          right: 16,
        }}
      />
    </Animated.View>
  );
};

type Sheets = {
  editGroceryItemSheetRef: RefObject<BottomSheetModal<EditGroceryItemSheetData> | null>;
  newGroceryItemSheetRef: RefObject<BottomSheetModal | null>;
  selectCategorySheetRef: RefObject<BottomSheetModal<SelectCategorySheetData> | null>;
};

const Groceries = () => {
  const addGroceryItem = useAddGroceryItem();
  const editGroceryItemSheetRef = useRef<BottomSheetModal<EditGroceryItemSheetData>>(null);
  const newGroceryItemSheetRef = useRef<BottomSheetModal>(null);
  const selectCategorySheetRef = useRef<BottomSheetModal<SelectCategorySheetData>>(null);
  const sheets: Sheets = { editGroceryItemSheetRef, newGroceryItemSheetRef, selectCategorySheetRef };

  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      <RouteTitle text="Groceries" />
      <PageContent sheets={sheets} />
      <EditGroceryItemSheet ref={editGroceryItemSheetRef} />
      <NewGroceryItemSheet
        ref={newGroceryItemSheetRef}
        onNext={(value) => {
          if (addGroceryItem.isPending) return;
          sheets.newGroceryItemSheetRef.current?.dismiss();
          sheets.selectCategorySheetRef.current?.present({ value });
        }}
      />
      <SelectCategorySheet
        ref={selectCategorySheetRef}
        onSelect={(name, aisle) => {
          if (addGroceryItem.isPending) return;
          sheets.selectCategorySheetRef.current?.dismiss();
          addGroceryItem.mutate({ name, aisle, status: 'pending' });
        }}
      />
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
    fontSize: 12,
    lineHeight: 12 * 1.5,
    textAlign: 'center',
    color: '#4A3E36',
    marginTop: 4,
  },
  leftActionContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  deleteButton: {
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: '#ff3b30',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Groceries;
