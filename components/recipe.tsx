import { Text } from '@/components/Text';
import plur from 'plur';
import { StyleSheet, View } from 'react-native';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { RecipeDTO, useEditRecipe } from '@/api/recipes';
import { colors } from '@/constants/colors';
import { toTitleCase } from 'remeda';
import { CookingPot, Heart, Timer } from 'lucide-react-native';
import { MealType } from '@/api/schedules';

type Props = {
  recipe: RecipeDTO;
  onPress: () => void;
  onLongPress?: () => void;
};

const MealTypeDots = (props: { mealTypes: MealType[] }) => {
  return (
    <View style={{ flexDirection: 'row' }}>
      {props.mealTypes.map((mealType, index) => (
        <View
          key={mealType}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor:
              mealType === 'breakfast'
                ? colors.green[500]
                : mealType === 'lunch'
                ? colors.orange[500]
                : colors.brown[700],
            ...(index > 0 && { marginLeft: -2 }),
          }}
        />
      ))}
    </View>
  );
};

const formatRecipeDuration = (totalMins: number) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h} ${plur('hr', h)} ${m} ${plur('min', m)}`;
  if (h > 0) return `${h} ${plur('hour', h)}`;
  return `${m} ${plur('minute', m)}`;
};

export const Recipe = ({
  recipe: { id, name, meal_types, ingredients, time_in_minutes, liked },
  onPress,
  onLongPress,
}: Props) => {
  const editRecipe = useEditRecipe();
  const formattedDuration = formatRecipeDuration(time_in_minutes);

  const handleLike = () => {
    const newState = !liked;
    editRecipe.mutate({ id, liked: newState });
  };

  return (
    <PressableWithHaptics
      scaleTo={0.985}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        position: 'relative',
        backgroundColor: '#FEF2DD',
        borderColor: '#4A3E36',
        borderWidth: 1,
        borderBottomWidth: 2,
        borderRadius: 8,
      }}
    >
      <PressableWithHaptics
        scaleTo={0.85}
        style={{ zIndex: 10, position: 'absolute', right: 10, top: 10 }}
        onPress={handleLike}
        hitSlop={15}
      >
        <Heart
          size={24}
          {...(liked ? { color: colors.orange[600], fill: colors.orange[500] } : { color: colors.brown[900] })}
        />
      </PressableWithHaptics>
      <View style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={styles.title}>{name}</Text>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <MealTypeDots mealTypes={meal_types} />
            <Text style={styles.description}>{meal_types.length > 1 ? 'Versatile' : toTitleCase(meal_types[0])}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Timer color={colors.brown[800]} width={14} height={14} strokeWidth={2.5} />
            <Text style={styles.description}>{formattedDuration}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <CookingPot color={colors.brown[800]} width={14} height={14} strokeWidth={2.5} />
            <Text style={styles.description}>
              {ingredients.length} ingredient{ingredients.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </PressableWithHaptics>
  );
};

const styles = StyleSheet.create({
  description: {
    color: colors.brown[800],
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 14 * 1.125,
  },
  title: {
    marginRight: 24,
    color: colors.brown[900],
    fontFamily: 'Satoshi-Black',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
});
