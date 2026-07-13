import { useDeleteRecipe } from '@/api/recipes';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SheetAction } from '@/components/sheet-action';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { useRouter } from 'expo-router';
import { Edit2, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

type RecipeOptionsSheetContentProps = {
  sheetId: SheetProps<'recipe-options-sheet'>['sheetId'];
  recipe: SheetProps<'recipe-options-sheet'>['data']['recipe'];
};

const RecipeOptionsSheetContent = ({ sheetId, recipe }: RecipeOptionsSheetContentProps) => {
  const sheets = useSheets();
  const router = useRouter();
  const deleteRecipe = useDeleteRecipe();

  return (
    <>
      <View style={{ marginBottom: 24 }}>
        <Typography variant="heading-sm" weight="bold">
          What to do with{' '}
          <Typography
            variant="heading-sm"
            weight="bold"
            style={{ backgroundColor: colors.orange[100], paddingHorizontal: 4, paddingVertical: 2, marginTop: 4 }}
          >
            &ldquo;{recipe.name}&rdquo;
          </Typography>
          ?
        </Typography>
      </View>
      <View style={{ gap: 16, marginBottom: 12 }}>
        <SheetAction
          text="Edit"
          icon={Edit2}
          onPress={() => {
            sheets.dismiss(sheetId);
            router.push({ pathname: '/edit-recipe/[id]', params: { id: recipe.id } });
          }}
        />
        <SheetAction
          text="Remove"
          icon={Trash2}
          tone="danger"
          onPress={() => {
            deleteRecipe.mutate({ id: recipe.id });
            sheets.dismiss(sheetId);
          }}
        />
      </View>
    </>
  );
};

export const RecipeOptionsSheet = (props: SheetProps<'recipe-options-sheet'>) => {
  return (
    <BaseSheet id={props.sheetId}>
      <RecipeOptionsSheetContent sheetId={props.sheetId} recipe={props.data.recipe} />
    </BaseSheet>
  );
};
