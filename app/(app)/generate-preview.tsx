import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchedule, IngredientDTO } from '@/api/schedules';
import { RecipeDTO } from '@/api/recipes';
import { getISOWeeksForDateRange, parseISO } from '@/date-tools';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/button';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';
import { unitFormatters } from '@/utils/unit-formatters';
import { ensure } from '@/utils';
import { ChevronLeft, WandSparkles } from 'lucide-react-native';
import { format, isAfter, isBefore } from 'date-fns';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { useState, useEffect, useMemo } from 'react';
import { values } from 'remeda';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Checkbox ─────────────────────────────────────────────────────────────────

const Checkbox = ({ progress }: { progress: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 0.5], ['#FEF2DD', '#F9974F']),
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [24, 0]),
    opacity: interpolate(progress.value, [0, 0.1, 1], [0, 1, 1]),
  }));

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

// ─── IngredientRow ─────────────────────────────────────────────────────────────

type IngredientRowProps = {
  ingredient: IngredientDTO;
  isChecked: boolean;
  onToggle: (id: string) => void;
  isFirst: boolean;
};

const IngredientRow = ({ ingredient, isChecked, onToggle, isFirst }: IngredientRowProps) => {
  const progress = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isChecked ? 1 : 0);
  }, [isChecked, progress]);

  return (
    <PressableWithHaptics
      onPress={() => onToggle(ingredient.id)}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
        !isFirst && { borderTopWidth: 1, borderColor: colors.brown[900] },
      ]}
    >
      <Checkbox progress={progress} />
      <Typography
        variant="body-base"
        weight="bold"
        color={isChecked ? colors.brown[900] : colors.brown[700]}
        style={{ flex: 1 }}
      >
        {ingredient.name}
      </Typography>
      {!(ingredient.quantity === 1 && ingredient.unit === 'count') && (
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
            {ingredient.quantity} {ensure(unitFormatters[ingredient.unit])({ count: ingredient.quantity })}
          </Typography>
        </View>
      )}
    </PressableWithHaptics>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GeneratePreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startDate, endDate } = useLocalSearchParams<{ startDate: string; endDate: string }>();

  const weeks = useMemo(() => getISOWeeksForDateRange(startDate, endDate), [startDate, endDate]);
  const { scheduleMap, isLoading } = useSchedule({ weeks });

  // Extract unique recipes + occurrence counts from the date range
  const recipesWithCounts = useMemo(() => {
    if (isLoading) return [];

    const occurrenceMap = new Map<string, number>();
    const recipeMap = new Map<string, RecipeDTO>();

    for (const day of values(scheduleMap)) {
      const dayDate = parseISO(day.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      // Inclusive range check
      if (isBefore(dayDate, start) || isAfter(dayDate, end)) continue;

      for (const entry of [day.breakfast, day.lunch, day.dinner]) {
        if (!entry || entry.type !== 'recipe') continue;
        const { recipe } = entry;
        occurrenceMap.set(recipe.id, (occurrenceMap.get(recipe.id) ?? 0) + 1);
        recipeMap.set(recipe.id, recipe);
      }
    }

    return Array.from(recipeMap.entries())
      .map(([id, recipe]) => ({ recipe, count: occurrenceMap.get(id) ?? 1 }))
      .sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
  }, [scheduleMap, isLoading, startDate, endDate]);

  // All ingredient IDs checked by default
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // Initialize selectedIds once recipes are loaded
  useEffect(() => {
    if (recipesWithCounts.length === 0) return;
    const allIds = recipesWithCounts.flatMap(({ recipe }) => recipe.ingredients.map((i: IngredientDTO) => i.id));
    setSelectedIds(new Set(allIds));
  }, [recipesWithCounts]);

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

  const handleSubmit = () => {
    const payload: Record<string, number> = {};
    for (const { recipe, count } of recipesWithCounts) {
      for (const ingredient of recipe.ingredients) {
        if (selectedIds.has(ingredient.id)) {
          payload[ingredient.id] = count;
        }
      }
    }
    console.log('Generation payload:', payload);
    router.back();
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
  if (recipesWithCounts.length === 0) {
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
          {format(parseISO(startDate), 'MMM d')} – {format(parseISO(endDate), 'MMM d, yyyy')}
        </Typography>
      </View>

      {/* Recipe list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 24, paddingBottom: insets.bottom + 100 }}
      >
        {recipesWithCounts.map(({ recipe, count }) => (
          <View key={recipe.id} style={{ gap: 4 }}>
            {/* Recipe header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
              <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ flex: 1 }}>
                {recipe.name}
              </Typography>
              {count > 1 && (
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 6,
                    height: 20,
                    backgroundColor: colors.orange[500],
                    borderWidth: 1,
                    borderBottomWidth: 2,
                    borderColor: colors.orange[600],
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body-sm" weight="bold" color={colors.cream[100]}>
                    ×{count}
                  </Typography>
                </View>
              )}
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
              {recipe.ingredients.map((ingredient: IngredientDTO, index: number) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  isChecked={selectedIds.has(ingredient.id)}
                  onToggle={toggleIngredient}
                  isFirst={index === 0}
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
          paddingBottom: insets.bottom + 16,
          paddingTop: 12,
          backgroundColor: '#FEF7EA',
        }}
      >
        <Button variant="primary" text="Generate" leftIcon={{ Icon: WandSparkles }} onPress={handleSubmit} />
      </View>
    </View>
  );
}
