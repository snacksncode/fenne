import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { useRouter } from 'expo-router';
import { Cog, ListTodo } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetManager } from 'react-native-actions-sheet';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';

type Props = {
  text: string;
  footerSlot?: ReactNode;
};

export const RouteTitle = ({ text, footerSlot }: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGuest, completedSteps, totalSteps, isComplete } = useTutorialProgress();

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
        borderBottomColor: '#4A3E36',
        borderBottomWidth: 1,
        backgroundColor: '#FEF7EA',
      }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{text}</Text>
        <PressableWithHaptics onPress={onPress} style={styles.button}>
          <Text
            style={{
              fontFamily: 'Satoshi-Bold',
              color: '#4A3E36',
              fontSize: 14,
            }}
          >
            {isGuest ? `Tutorial ${isComplete ? 'complete!' : `(${completedSteps}/${totalSteps})`}` : 'Settings'}
          </Text>
          {isGuest ? (
            <ListTodo color="#4A3E36" strokeWidth={2} size={24} />
          ) : (
            <Cog color="#4A3E36" strokeWidth={2} size={24} />
          )}
        </PressableWithHaptics>
      </View>
      {footerSlot}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Satoshi-Black',
    color: '#4A3E36',
    fontSize: 32,
    lineHeight: 32 * 1.5,
  },
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
