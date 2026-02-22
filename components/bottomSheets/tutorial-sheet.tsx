import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Check, ArrowRight, Trash2 } from 'lucide-react-native';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';
import { Button } from '@/components/button';

const ChecklistItem = ({ title, isDone, onPress }: { title: string; isDone: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.itemContainer, isDone && styles.itemContainerDone]}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, isDone ? styles.iconContainerDone : styles.iconContainerTodo]}>
      <Check size={16} color="white" strokeWidth={3} />
    </View>
    <Typography variant="body-base" weight="bold" style={isDone ? { flex: 1, ...styles.itemTextDone } : { flex: 1 }}>
      {title}
    </Typography>
    {!isDone && <ArrowRight size={20} color={colors.brown[900]} />}
  </TouchableOpacity>
);

export const TutorialSheet = (props: SheetProps<'tutorial-sheet'>) => {
  const router = useRouter();
  const { hasRecipes, hasSchedule, hasGroceries } = useTutorialProgress();

  const navigateTo = (route: string) => {
    SheetManager.hide(props.sheetId);
    router.push(route as any);
  };

  const handleExitTutorial = async () => {
    const deleted = await SheetManager.show('delete-account-sheet', { payload: { variant: 'guest' } });
    if (deleted) SheetManager.hide(props.sheetId);
  };

  return (
    <BaseSheet id={props.sheetId}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Typography variant="heading-md" weight="bold">
            Let&apos;s show you around
          </Typography>
          <Typography variant="body-base" weight="regular" color={colors.brown[800]}>
            The only 3 things you need
          </Typography>
        </View>
        <View style={styles.listContainer}>
          <ChecklistItem
            title="Create your first recipe"
            isDone={hasRecipes}
            onPress={() => navigateTo('/(app)/(tabs)/recipes')}
          />
          <ChecklistItem
            title="Plan a meal for tomorrow"
            isDone={hasSchedule}
            onPress={() => navigateTo('/(app)/(tabs)/')}
          />
          <ChecklistItem
            title="Generate your grocery list"
            isDone={hasGroceries}
            onPress={() => navigateTo('/(app)/(tabs)/groceries')}
          />
          <View style={{ position: 'relative', alignItems: 'center' }}>
            <View
              style={{
                position: 'absolute',
                width: '100%',
                top: '50%',
                transform: 'translateY(1px)',
                height: 1,
                backgroundColor: colors.brown[900],
              }}
            />
            <Typography
              variant="body-base"
              weight="medium"
              style={{ backgroundColor: colors.cream[100], paddingHorizontal: 8 }}
            >
              or
            </Typography>
          </View>
          <Button
            onPress={handleExitTutorial}
            variant="red-outlined"
            size="small"
            text="Exit tutorial"
            leftIcon={{ Icon: Trash2 }}
          />
        </View>
      </View>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  headerContainer: {
    gap: 8,
  },

  listContainer: {
    gap: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.cream[50],
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    gap: 12,
  },
  itemContainerDone: {
    backgroundColor: 'rgba(97, 170, 100, 0.1)',
    borderColor: colors.green[600],
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  iconContainerTodo: {
    borderColor: colors.brown[900],
  },
  iconContainerDone: {
    backgroundColor: colors.green[500],
    borderColor: colors.green[600],
  },

  itemTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  footer: {
    marginTop: 8,
  },
});
