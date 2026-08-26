import { useProductUsages } from '@/api/products';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Recipe } from '@/components/recipe';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { CircleCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

export const ProductUsagesSheet = (props: SheetProps<'product-usages-sheet'>) => {
  const { product, blockers } = props.data;
  const usages = useProductUsages(product.id, blockers == null);
  const sheets = useSheets();
  const router = useRouter();
  const recipes = blockers?.recipes ?? usages.data?.recipes ?? [];
  const isLoading = !blockers && usages.isLoading;

  const openRecipe = async (recipeId: string) => {
    await sheets.dismiss(props.sheetId);
    router.push({ pathname: '/recipe/[id]', params: { id: recipeId } });
  };

  return (
    <BaseSheet
      id={props.sheetId}
      sizing={{ type: 'scrollable', detents: [0.5, 1] }}
      initialDetentIndex={0}
    >
      <View style={{ marginBottom: 8 }}>
        <ShoppingItemIdentity name={product.name} aisle={product.aisle} />
      </View>
      {blockers ? (
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Typography variant="body-sm" weight="medium" color={colors.red[600]}>
            This shopping item can’t be removed yet. Remove it from these recipes first.
          </Typography>
        </View>
      ) : null}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator color={colors.orange[600]} />
          </View>
        ) : usages.isError && !blockers ? (
          <Typography variant="body-sm" weight="medium" color={colors.red[600]}>
            Couldn’t load this shopping item’s recipes. Please try again.
          </Typography>
        ) : recipes.length > 0 ? (
          recipes.map((recipe) => <Recipe key={recipe.id} recipe={recipe} onPress={() => openRecipe(recipe.id)} />)
        ) : (
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
            <CircleCheck color={colors.green[500]} size={42} strokeWidth={1.8} />
            <Typography variant="body-base" weight="bold">
              Not used in any recipes
            </Typography>
          </View>
        )}
      </ScrollView>
    </BaseSheet>
  );
};
