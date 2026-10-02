import Sortable, { useCustomHandleContext, useIsInPortalOutlet, useItemContext } from 'react-native-sortables';
import { IngredientFormData } from '@/api/types';
import { Button } from '@/components/button';
import { CookingPot, GripVertical, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';
import { Typography } from '@/components/Typography';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeOut,
  FadeIn,
  interpolate,
  LinearTransition,
  runOnUI,
  useAnimatedStyle,
  useAnimatedRef,
  useSharedValue,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { scheduleOnUI } from 'react-native-worklets';
import { isEmpty } from 'remeda';
import { colors } from '@/constants/colors';
import { UNITS, parseLocaleFloat } from '@/lib/quantity';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';

const INGREDIENT_LIST_VERTICAL_PADDING = 4;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Sortables 1.9 invokes runOnUI during render for onLayout; keep invocation in the event handler.
const IngredientDragHandle = ({ children }: { children: React.ReactNode }) => {
  const isTeleported = useIsInPortalOutlet();
  const customHandleContext = useCustomHandleContext();
  const { gesture, isActive, itemKey } = useItemContext();
  const handleRef = useAnimatedRef<View>();

  if (!customHandleContext) {
    throw new Error('IngredientDragHandle must be rendered inside a sortable with customHandle enabled.');
  }

  const { registerHandle, updateActiveHandleMeasurements } = customHandleContext;

  useEffect(() => registerHandle(itemKey, handleRef, false), [handleRef, itemKey, registerHandle]);

  const updateMeasurements = useCallback(() => {
    'worklet';
    if (isActive.value) updateActiveHandleMeasurements(itemKey);
  }, [isActive, itemKey, updateActiveHandleMeasurements]);

  const handleLayout = useCallback(() => {
    runOnUI(updateMeasurements)();
  }, [updateMeasurements]);

  if (isTeleported) return <View>{children}</View>;

  return (
    <GestureDetector gesture={gesture.enabled(true)} userSelect="none">
      <View collapsable={false} ref={handleRef} onLayout={handleLayout}>
        {children}
      </View>
    </GestureDetector>
  );
};

const RightActions = (props: { progress: SharedValue<number>; onDelete: () => void }) => {
  const [width, setWidth] = useState(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(props.progress.value, [0, 1], [width, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.deleteActionContainer, animatedStyle]}
    >
      <Button size="small" variant="red-outlined" onPress={props.onDelete} text="Delete" leftIcon={{ Icon: Trash2 }} />
    </Animated.View>
  );
};

const IngredientItem = ({
  ingredient,
  onEdit,
  onDelete,
  onLayout,
  style,
}: {
  ingredient: IngredientFormData;
  style?: StyleProp<ViewStyle>;
  onEdit: () => void;
  onDelete: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const displayName = ingredient.name_override?.trim() || ingredient.selectedProduct.product.name || ingredient.name;

  const closeSwipeable = () => swipeRef.current?.close();

  const handleEdit = () => {
    closeSwipeable();
    onEdit();
  };

  return (
    <Animated.View
      layout={LinearTransition.springify()}
      exiting={FadeOut}
      entering={FadeIn}
      onLayout={onLayout}
      style={style}
    >
      <ReanimatedSwipeable
        ref={swipeRef}
        friction={1.5}
        rightThreshold={20}
        renderRightActions={(progress) => <RightActions progress={progress} onDelete={onDelete} />}
        childrenContainerStyle={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <AnimatedPressable
          onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(0.95)))}
          onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
          onPress={handleEdit}
          style={[styles.ingredientContent, scaleStyle]}
        >
          <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
            {displayName}
          </Typography>
          {ingredient.selectedProduct.type === 'existing' &&
            ingredient.selectedProduct.product.name !== displayName && (
              <Typography variant="body-xs" weight="medium" color={colors.brown[700]} style={{ marginTop: 2 }}>
                Shopping item: {ingredient.selectedProduct.product.name}
              </Typography>
            )}
          {ingredient.quantity && (
            <Typography variant="body-xs" weight="medium" color={colors.brown[700]} style={{ marginTop: 2 }}>
              {ingredient.quantity}{' '}
              {UNITS.find((u) => u.value === ingredient.unit)?.label({ count: parseLocaleFloat(ingredient.quantity) })}
            </Typography>
          )}
        </AnimatedPressable>
        <IngredientDragHandle>
          <View style={styles.dragHandle}>
            <GripVertical size={24} color={colors.brown[700]} />
          </View>
        </IngredientDragHandle>
      </ReanimatedSwipeable>
    </Animated.View>
  );
};

const EmptyIngredientsList = () => (
  <View
    style={{
      backgroundColor: colors.surface.subtle,
      padding: 16,
      paddingBottom: 20,
      borderRadius: 8,
      borderColor: colors.border.muted,
      borderStyle: 'dashed',
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 125,
    }}
  >
    <CookingPot size={24} color={colors.brown[900]} />
    <Typography variant="body-base" weight="black" color={colors.brown[900]} style={{ marginTop: 8 }}>
      No ingredients
    </Typography>
    <Typography variant="body-sm" weight="bold" color={colors.brown[800]}>
      Tap to add one
    </Typography>
  </View>
);

type IngredientMeasurement = {
  id: string;
  height: number;
};

const useIngredientDividerLayout = (ingredients: IngredientFormData[]) => {
  const [measurements, setMeasurements] = useState<IngredientMeasurement[]>([]);

  const onIngredientLayout = useCallback((id: string, event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;

    setMeasurements((current) => {
      const existingIndex = current.findIndex((measurement) => measurement.id === id);
      if (existingIndex === -1) return [...current, { id, height }];
      if (current[existingIndex]?.height === height) return current;

      return current.map((measurement, index) => (index === existingIndex ? { id, height } : measurement));
    });
  }, []);

  const dividerOffsets = useMemo(() => {
    const heightsById = new Map(measurements.map((measurement) => [measurement.id, measurement.height]));
    if (ingredients.some((ingredient) => heightsById.get(ingredient.id) == null)) return [];

    let offset = INGREDIENT_LIST_VERTICAL_PADDING;

    return ingredients.slice(0, -1).map((ingredient) => {
      offset += heightsById.get(ingredient.id) ?? 0;
      return offset;
    });
  }, [ingredients, measurements]);

  return { dividerOffsets, onIngredientLayout };
};

export const RecipeIngredients = ({
  ingredients,
  handleAddIngredient,
  onIngredientEdit,
  onIngredientDelete,
  onIngredientsReorder,
}: {
  ingredients: IngredientFormData[];
  handleAddIngredient: () => void;
  onIngredientEdit: (ingredient: IngredientFormData) => void;
  onIngredientDelete: (ingredient: IngredientFormData) => void;
  onIngredientsReorder: (ingredients: IngredientFormData[]) => void;
}) => {
  const { dividerOffsets, onIngredientLayout } = useIngredientDividerLayout(ingredients);

  const renderIngredient = useCallback(
    ({ item: ingredient }: { item: IngredientFormData }) => (
      <IngredientItem
        style={styles.ingredientItem}
        ingredient={ingredient}
        onEdit={() => onIngredientEdit(ingredient)}
        onDelete={() => onIngredientDelete(ingredient)}
        onLayout={(event) => onIngredientLayout(ingredient.id, event)}
      />
    ),
    [onIngredientDelete, onIngredientEdit, onIngredientLayout]
  );

  if (isEmpty(ingredients)) {
    return (
      <PressableWithHaptics onPress={handleAddIngredient}>
        <EmptyIngredientsList />
      </PressableWithHaptics>
    );
  }

  return (
    <Animated.View
      style={{
        backgroundColor: colors.surface.raised,
        borderWidth: 1,
        borderBottomWidth: 2,
        borderColor: colors.brown[900],
        borderRadius: 8,
        paddingVertical: INGREDIENT_LIST_VERTICAL_PADDING,
        overflow: 'hidden',
      }}
      layout={LinearTransition.springify()}
      exiting={FadeOut}
      entering={FadeIn}
    >
      <Sortable.Grid
        columns={1}
        data={ingredients}
        keyExtractor={(ingredient) => ingredient.id}
        renderItem={renderIngredient}
        customHandle
        dragActivationDelay={250}
        overDrag="vertical"
        activeItemScale={1.02}
        onDragEnd={({ data }) => onIngredientsReorder(data)}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {dividerOffsets.map((top, index) => (
          <Animated.View
            key={`ingredient-divider-${index}`}
            layout={LinearTransition.springify()}
            style={[styles.ingredientDivider, { top }]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  deleteActionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  dragHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -12,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientItem: {
    width: '100%',
  },
  ingredientDivider: {
    borderColor: colors.brown[900],
    borderStyle: 'dashed',
    borderTopWidth: 1,
    height: 0,
    left: 0,
    opacity: 0.25,
    position: 'absolute',
    right: 0,
  },
});
