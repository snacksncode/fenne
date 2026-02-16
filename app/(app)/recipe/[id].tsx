import React from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Pencil, CookingPot, Timer, Heart, FileText } from 'lucide-react-native';
import RenderHTML, { defaultSystemFonts } from 'react-native-render-html';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/button';
import { MealTypeDots, formatRecipeDuration, formatRecipeMealTypes } from '@/components/recipe';
import { useRecipe, useEditRecipe } from '@/api/recipes';
import { isHtmlEmpty } from '@/utils/is-html-empty';
import { colors } from '@/constants/colors';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { unitFormatters } from '@/app/(app)/(tabs)/groceries';
import { ensure } from '@/utils';

const systemFonts = [
  ...defaultSystemFonts,
  'Satoshi-Regular',
  'Satoshi-Medium',
  'Satoshi-Bold',
  'Satoshi-Black',
  'Satoshi-Italic',
  'Satoshi-MediumItalic',
  'Satoshi-BoldItalic',
  'Satoshi-BlackItalic',
];

const baseStyle = {
  fontFamily: 'Satoshi-Medium',
  fontSize: 16,
  color: colors.brown[900],
};

const tagsStyles = {
  h1: { fontSize: 24, fontFamily: 'Satoshi-Bold' },
  h2: { fontSize: 20, fontFamily: 'Satoshi-Bold' },
  h3: { fontSize: 18, fontFamily: 'Satoshi-Bold' },
  a: { color: colors.orange[600], textDecorationLine: 'underline' as const },
  strong: { fontFamily: 'Satoshi-Bold' },
  b: { fontFamily: 'Satoshi-Bold' },
  em: { fontFamily: 'Satoshi-Medium', fontStyle: 'italic' as const },
  i: { fontFamily: 'Satoshi-Medium', fontStyle: 'italic' as const },
  u: { textDecorationLine: 'underline' as const },
};

const renderersProps = {
  ol: { markerTextStyle: { color: colors.brown[900], fontFamily: 'Satoshi-Medium' } },
  ul: { markerTextStyle: { color: colors.brown[900], fontFamily: 'Satoshi-Medium' } },
};

export default function RecipePreview() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe({ id });
  const editRecipe = useEditRecipe();
  const { width } = useWindowDimensions();

  if (!recipe.data) {
    return (
      <View
        style={{
          backgroundColor: '#FEF7EA',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color={colors.brown[900]} />
      </View>
    );
  }

  const { name, meal_types, ingredients, time_in_minutes, liked } = recipe.data;
  const notes = recipe.data.notes;
  const hasNotes = !isHtmlEmpty(notes);

  const handleLike = () => {
    editRecipe.mutate({ id, liked: !liked });
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#FEF7EA', flex: 1, paddingHorizontal: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            marginLeft: -8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ChevronLeft color={colors.brown[900]} />
          <Typography variant="heading-sm" weight="bold">
            Recipes
          </Typography>
        </Pressable>
        <Button
          variant="outlined"
          size="small"
          text="Edit"
          leftIcon={{ Icon: Pencil }}
          onPress={() => router.push({ pathname: '/edit-recipe/[id]', params: { id } })}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <View style={{ position: 'relative' }}>
          <Typography variant="heading-lg" weight="black" style={{ marginRight: 40 }}>
            {name}
          </Typography>
          <PressableWithHaptics
            scaleTo={0.85}
            style={{ position: 'absolute', right: 0, top: 6 }}
            onPress={handleLike}
            hitSlop={15}
          >
            <Heart
              size={28}
              {...(liked ? { color: colors.orange[600], fill: colors.orange[500] } : { color: colors.brown[900] })}
            />
          </PressableWithHaptics>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <MealTypeDots mealTypes={meal_types} />
            <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
              {formatRecipeMealTypes(meal_types)}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Timer color={colors.brown[800]} width={14} height={14} strokeWidth={2.5} />
            <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
              {formatRecipeDuration(time_in_minutes)}
            </Typography>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <CookingPot color={colors.brown[800]} width={14} height={14} strokeWidth={2.5} />
            <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
              {ingredients.length} ingredient{ingredients.length > 1 ? 's' : ''}
            </Typography>
          </View>
        </View>

        <View>
          <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ marginBottom: 4 }}>
            Ingredients
          </Typography>

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
            {ingredients.map((ingredient, index) => (
              <View
                key={ingredient.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  ...(index > 0 && { borderTopWidth: 1, borderColor: colors.brown[900] }),
                }}
              >
                <Typography variant="body-base" weight="bold" color={colors.brown[900]} style={{ flex: 1 }}>
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
                    }}
                  >
                    <Typography variant="body-sm" weight="bold" color={colors.cream[100]}>
                      {ingredient.quantity}
                      {ensure(unitFormatters[ingredient.unit])({ count: ingredient.quantity })}
                    </Typography>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View>
          <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ marginBottom: 4 }}>
            Notes
          </Typography>
          {hasNotes ? (
            <View
              style={{
                backgroundColor: '#FEF4E2',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                borderColor: colors.brown[900],
                borderStyle: 'solid',
                borderWidth: 1,
                borderBottomWidth: 2,
              }}
            >
              <RenderHTML
                contentWidth={width - 74}
                source={{ html: notes }}
                baseStyle={baseStyle}
                tagsStyles={tagsStyles}
                systemFonts={systemFonts}
                renderersProps={renderersProps}
              />
            </View>
          ) : (
            <PressableWithHaptics
              onPress={() => router.push({ pathname: '/edit-recipe/[id]', params: { id } })}
              style={{
                backgroundColor: '#FEF4E2',
                padding: 16,
                paddingBottom: 20,
                borderRadius: 8,
                borderColor: '#D1C5B3',
                borderStyle: 'dashed',
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                height: 125,
              }}
            >
              <FileText size={24} color={colors.brown[900]} />
              <Typography variant="body-base" weight="black" color={colors.brown[900]} style={{ marginTop: 8 }}>
                No notes
              </Typography>
              <Typography variant="body-sm" weight="bold" color={colors.brown[800]}>
                Anything important to remember?
              </Typography>
            </PressableWithHaptics>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
