import { RecipeDTO, useDeleteRecipe } from '@/api/recipes';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Edit2, Trash2 } from 'lucide-react-native';
import { FunctionComponent, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export type RecipeOptionsSheetData = { recipe: RecipeDTO };

type SheetProps = {
  ref: RefObject<BottomSheetModal<RecipeOptionsSheetData> | null>;
};

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

const Content = ({ recipe }: { recipe: RecipeDTO }) => {
  const router = useRouter();
  const { dismiss } = useBottomSheetModal();
  const deleteRecipe = useDeleteRecipe();

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>
        What to do with{'\n'}
        <Text style={{ backgroundColor: colors.orange[100] }}>&ldquo;{recipe.name}&rdquo;</Text>?
      </Text>
      <View style={{ gap: 16, marginBottom: 12 }}>
        <Action
          text="Edit"
          icon={Edit2}
          onPress={() => {
            dismiss();
            router.push({ pathname: '/edit-recipe/[id]', params: { id: recipe.id } });
          }}
        />
        <Action
          text="Remove"
          icon={Trash2}
          onPress={() => {
            deleteRecipe.mutate({ id: recipe.id });
            dismiss();
          }}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const RecipeOptionsSheet = ({ ref }: SheetProps) => {
  return (
    <BaseSheet<RecipeOptionsSheetData> ref={ref}>
      {({ data }) => (data ? <Content recipe={data.recipe} /> : null)}
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
