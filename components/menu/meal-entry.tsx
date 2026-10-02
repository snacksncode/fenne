import { MealEntryDTO, MealType } from '@/api/types';
import { ListLayoutView } from '@/components/animated-list';
import { MealTypeKicker } from '@/components/menu/meal-type-kicker';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { useSheets } from '@/lib/sheet-context';
import { useRouter } from 'expo-router';
import { LayoutAnimationConfig } from 'react-native-reanimated';

export const MealEntry = ({ entry, dateString }: { entry: MealEntryDTO & { mealType: MealType }; dateString: string }) => {
  const router = useRouter();
  const sheets = useSheets();
  // A recycled day/slot is a fresh display. Only replacing the contents of an
  // existing slot should fade; server confirmation may change entry.id alone.
  const contentKey = entry.type === 'recipe'
    ? `recipe:${entry.recipe.id}:${entry.recipe.name}`
    : `dining_out:${entry.name}`;
  return (
    <LayoutAnimationConfig key={`${dateString}:${entry.mealType}`} skipEntering skipExiting>
      <ListLayoutView key={contentKey}>
        <PressableWithHaptics
          onPress={
            entry.type === 'recipe'
              ? () => router.push({ pathname: '/recipe/[id]', params: { id: entry.recipe.id } })
              : undefined
          }
          onLongPress={() => {
            sheets.present('edit-meal-sheet', {
              data: { entry: { ...entry, dateString } },
            });
          }}
          style={{ gap: 2 }}
          scaleTo={0.985}
        >
          <MealTypeKicker type={entry.mealType} />
          <Typography variant="heading-sm" weight="black">
            {entry.type === 'recipe' ? entry.recipe.name : entry.name}
          </Typography>
        </PressableWithHaptics>
      </ListLayoutView>
    </LayoutAnimationConfig>
  );
};
