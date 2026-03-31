import { useDeleteRecipe } from '@/api/recipes';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SheetAction } from '@/components/sheet-action';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { useRouter } from 'expo-router';
import { Edit2, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

export const RecipeOptionsSheet = (props: SheetProps<'recipe-options-sheet'>) => {
  const recipe = props.payload?.recipe;
  const router = useRouter();
  const deleteRecipe = useDeleteRecipe();

  if (!recipe) return null;

  return (
    <BaseSheet id={props.sheetId}>
      <BaseSheet.Container>
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
              SheetManager.hide(props.sheetId);
              router.push({ pathname: '/edit-recipe/[id]', params: { id: recipe.id } });
            }}
          />
          <SheetAction
            text="Remove"
            icon={Trash2}
            onPress={() => {
              deleteRecipe.mutate({ id: recipe.id });
              SheetManager.hide(props.sheetId);
            }}
          />
        </View>
      </BaseSheet.Container>
    </BaseSheet>
  );
};
