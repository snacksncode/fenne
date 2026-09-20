import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { GroceryRecipeList } from '@/components/grocery-recipe-list';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, CookingPot } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

export const GroceryRecipesSheet = ({ sheetId, data }: SheetProps<'grocery-recipes-sheet'>) => {
  const { name, recipes, reason } = data;
  const sheets = useSheets();
  const router = useRouter();
  const openRecipe = async (id: string) => {
    await sheets.dismiss(sheetId);
    router.push({ pathname: '/recipe/[id]', params: { id } });
  };

  return (
    <BaseSheet id={sheetId} sizing={{ type: 'scrollable', detents: [0.5, 1] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <PressableWithHaptics accessibilityRole="button" accessibilityLabel="Close recipe explanation"
          onPress={() => sheets.dismiss(sheetId)} hitSlop={8} style={{ paddingVertical: 8 }}>
          <ChevronLeft size={24} color={colors.brown[900]} />
        </PressableWithHaptics>
        <Typography variant="heading-sm" weight="bold" style={{ flex: 1 }}>{name}</Typography>
        <CookingPot size={24} color={colors.brown[900]} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: 16, paddingBottom: 24 }}>
          {recipes.length > 0 && <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
            On your list for these recipes.
          </Typography>}
          <GroceryRecipeList recipes={recipes} onPress={openRecipe} emptyMessage={reason} />
        </View>
      </ScrollView>
    </BaseSheet>
  );
};
