import { MealTypeKicker } from '@/components/menu/meal-type-kicker';
import { Text } from '@/components/Text';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export type RecipeDTO = {
  type: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  ingredients: string;
};

type Props = {
  recipe: RecipeDTO;
  onPress: () => void;
};

export const Recipe = ({ recipe: { type, name, ingredients }, onPress }: Props) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            backgroundColor: '#FEF2DD',
            borderColor: '#4A3E36',
            borderWidth: 1,
            borderBottomWidth: 2,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
          },
          scaleStyle,
        ]}
      >
        <View style={{ gap: 2 }}>
          <MealTypeKicker type={type} />
          <Text
            style={{
              color: '#4A3E36',
              fontFamily: 'Satoshi-Black',
              fontSize: 20,
              lineHeight: 20 * 1.25,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              color: '#807468',
              fontFamily: 'Satoshi-Medium',
              fontSize: 13,
              lineHeight: 13 * 1.3,
              marginTop: 4,
            }}
          >
            Ingredients: {ingredients}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};
