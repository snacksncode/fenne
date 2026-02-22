import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { useRouter } from 'expo-router';
import { Cog, ListTodo } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetManager } from 'react-native-actions-sheet';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';
import { colors } from '@/constants/colors';
import { Button } from '@/components/button';

type Props = {
  text: string;
  footerSlot?: ReactNode;
};

export const RouteTitle = ({ text, footerSlot }: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGuest } = useTutorialProgress();

  const onPress = () => {
    if (isGuest) {
      SheetManager.show('tutorial-sheet');
    } else {
      router.push('/settings');
    }
  };

  return (
    <View
      style={{
        zIndex: 1,
        paddingTop: insets.top,
        left: 0,
        right: 0,
        paddingBottom: 10,
        position: 'absolute',
        paddingHorizontal: 20,
        borderBottomColor: colors.brown[900],
        borderBottomWidth: 1,
        backgroundColor: colors.cream[100],
      }}
    >
      <View style={styles.container}>
        <Typography variant="heading-lg" weight="black">
          {text}
        </Typography>
        {!isGuest && (
          <PressableWithHaptics hitSlop={20} scaleTo={0.9} onPress={onPress} style={styles.button}>
            <Typography variant="body-sm" weight="bold" color={colors.brown[900]}>
              Settings
            </Typography>
            <Cog color={colors.brown[900]} strokeWidth={2} size={24} />
          </PressableWithHaptics>
        )}
        {isGuest && (
          <Button onPress={onPress} variant="primary" size="small" text={`Todo list`} leftIcon={{ Icon: ListTodo }} />
        )}
      </View>
      {footerSlot}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  button: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
