import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MealType } from '@/api/schedules';
import { useGenerateGroceryItems, useGroceryPreview, PreviewIngredientDTO } from '@/api/groceries';
import { parseISO } from '@/date-tools';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { scheduleOnUI } from 'react-native-worklets';
import { colors } from '@/constants/colors';
import { Pancake } from '@/components/svgs/pancake';
import { ChevronLeft, WandSparkles, Ham, Salad } from 'lucide-react-native';
import { format } from 'date-fns';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';

// ─── Recipe Icon ──────────────────────────────────────────────────────────────

const RecipeIcon = ({ mealType }: { mealType: MealType }) => {
  const iconProps = { color: '#CD7E34', size: 24 };
  return (
    <View style={{ padding: 4, backgroundColor: colors.orange[100], borderRadius: 8 }}>
      {mealType === 'breakfast' ? (
        <Pancake {...iconProps} />
      ) : mealType === 'lunch' ? (
        <Salad {...iconProps} />
      ) : (
        <Ham {...iconProps} />
      )}
    </View>
  );
};

const Count = ({ count }: { count: number }) => {
  return (
    <View
      style={{
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        height: 32,
        backgroundColor: colors.orange[100],
        borderRadius: 8,
      }}
    >
      <Typography variant="body-sm" weight="black" color="#CD7E34">
        x{count}
      </Typography>
    </View>
  );
};

// ─── IngredientRow ─────────────────────────────────────────────────────────────

type IngredientRowProps = {
  ingredient: PreviewIngredientDTO;
  isChecked: boolean;
  onToggle: (id: string) => void;
};

const IngredientRow = ({ ingredient, isChecked, onToggle }: IngredientRowProps) => {
  const { progress } = useCheckbox(isChecked);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 1]),
  }));

  return (
    <Animated.View style={opacityStyle}>
      <Pressable
        onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(0.9)))}
        onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
        onPress={() => onToggle(ingredient.id)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <Animated.View style={scaleStyle}>
          <Checkbox progress={progress} />
        </Animated.View>
        <Typography variant="body-base" weight="bold" color={colors.brown[900]} style={{ flex: 1 }}>
          {ingredient.name}
        </Typography>
        <View
          style={{
            borderRadius: 999,
            height: 24,
            paddingHorizontal: 6,
            backgroundColor: colors.orange[500],
            borderWidth: 2,
            borderBottomWidth: 3,
            borderColor: colors.orange[600],
            justifyContent: 'center',
          }}
        >
          <Typography variant="body-sm" weight="bold" color={colors.cream[100]}>
            {ingredient.quantity} {ingredient.unit}
          </Typography>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function GeneratePreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startDate, endDate } = useLocalSearchParams<{ startDate: string; endDate: string }>();

  const { data: recipes = [], isLoading } = useGroceryPreview({ start: startDate, end: endDate });

  // All ingredient IDs checked by default
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const initializedRef = useRef(false);

  // Initialize selectedIds once recipes are loaded (one-time only)
  useEffect(() => {
    if (recipes.length === 0 || initializedRef.current) return;
    initializedRef.current = true;
    const allIds = recipes.flatMap((r) => r.ingredients.map((i) => i.id));
    setSelectedIds(new Set(allIds));
  }, [recipes]);

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const generateGroceryItems = useGenerateGroceryItems();

  const handleSubmit = () => {
    const ingredients: Record<string, number> = {};
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        if (selectedIds.has(ingredient.id)) {
          ingredients[ingredient.id] = 1;
        }
      }
    }
    generateGroceryItems.mutate(
      { start: startDate, end: endDate, ingredients },
      {
        onSuccess: () => router.back(),
      }
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FEF7EA', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.brown[900]} />
      </View>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (recipes.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ marginLeft: -8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <ChevronLeft color={colors.brown[900]} />
            <Typography variant="heading-sm" weight="bold">
              Groceries
            </Typography>
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Typography variant="heading-sm" weight="bold" style={{ textAlign: 'center' }}>
            No recipes found
          </Typography>
          <Typography
            variant="body-base"
            weight="regular"
            color={colors.brown[700]}
            style={{ textAlign: 'center', marginTop: 8 }}
          >
            No recipes are scheduled for this date range
          </Typography>
        </View>
      </View>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ marginLeft: -8, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}
        >
          <ChevronLeft color={colors.brown[900]} />
          <Typography variant="heading-sm" weight="bold">
            Groceries
          </Typography>
        </Pressable>
        <Typography variant="heading-sm" weight="bold">
          Review items
        </Typography>
        <Typography variant="body-base" weight="regular" color={colors.brown[800]}>
          {format(parseISO(startDate), 'EEEE, MMM d')} – {format(parseISO(endDate), 'EEEE, MMM d')}
        </Typography>
      </View>

      {/* Recipe list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 32, paddingBottom: insets.bottom + 100 }}
      >
        {recipes.map((recipe) => (
          <View key={recipe.id} style={{ gap: 4 }}>
            {/* Recipe header */}
            <View style={{ gap: 8, flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: 4 }}>
              <Typography
                variant="heading-sm"
                weight="bold"
                color={colors.brown[800]}
                style={{ flex: 1, marginRight: '25%' }}
              >
                {recipe.name}
              </Typography>
              <View style={{ flexDirection: 'row', gap: 4, alignSelf: 'flex-end' }}>
                <RecipeIcon mealType={recipe.meal_type} />
                {recipe.amount > 1 && <Count count={recipe.amount} />}
              </View>
            </View>

            {/* Ingredients box */}
            <View
              style={{
                backgroundColor: '#FEF2DD',
                borderWidth: 1,
                borderBottomWidth: 2,
                borderColor: colors.brown[900],
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {recipe.ingredients.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  isChecked={selectedIds.has(ingredient.id)}
                  onToggle={toggleIngredient}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom,
          paddingTop: 12,
          backgroundColor: '#FEF7EA',
          borderTopWidth: 1,
          borderColor: colors.brown[800],
        }}
      >
        <Button
          variant="primary"
          text="Generate"
          leftIcon={{ Icon: WandSparkles }}
          onPress={handleSubmit}
          isLoading={generateGroceryItems.isPending}
        />
      </View>
    </View>
  );
}
