import { RecipeDTO, useDeleteRecipe } from '@/api/recipes';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { useRouter } from 'expo-router';
import { Edit2, Trash2 } from 'lucide-react-native';
import { FunctionComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const Action = (props: {
  onPress: () => void;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
}) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress: props.onPress, scaleTo: 0.985 });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flexDirection: 'row', gap: 12, alignItems: 'center' }, scaleStyle]}>
        <View style={{ backgroundColor: '#493D34', padding: 4, borderRadius: 4 }}>
          <props.icon color="#FEF7EA" size={20} />
        </View>
        <Text style={styles.actionText}>{props.text}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

export const RecipeOptionsSheet = (props: SheetProps<'recipe-options-sheet'>) => {
  const recipe = props.payload?.recipe;
  const router = useRouter();
  const deleteRecipe = useDeleteRecipe();

  if (!recipe) return null;

  return (
    <BaseSheet id={props.sheetId}>
      <Text style={styles.header}>
        What to do with{'\n'}
        <Text style={{ backgroundColor: colors.orange[100] }}>&ldquo;{recipe.name}&rdquo;</Text>?
      </Text>
      <View style={{ gap: 16, marginBottom: 12 }}>
        <Action
          text="Edit"
          icon={Edit2}
          onPress={() => {
            SheetManager.hide(props.sheetId);
            router.push({ pathname: '/edit-recipe/[id]', params: { id: recipe.id } });
          }}
        />
        <Action
          text="Remove"
          icon={Trash2}
          onPress={() => {
            deleteRecipe.mutate({ id: recipe.id });
            SheetManager.hide(props.sheetId);
          }}
        />
      </View>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  actionText: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.25,
  },
});
