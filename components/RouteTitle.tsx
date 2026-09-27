import { BlurView } from 'expo-blur';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { useRouter } from 'expo-router';
import { Cog, ListTodo, LucideIcon } from 'lucide-react-native';
import { ReactNode, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSheets } from '@/lib/sheet-context';
import { useTutorialProgress } from '@/hooks/use-tutorial-progress';
import { colors } from '@/constants/colors';
import { Button } from '@/components/button';

type Props = {
  blurTarget: RefObject<View | null>;
  icon: LucideIcon;
  text: string;
  rightSlot?: ReactNode;
};

export const RouteTitle = ({ blurTarget, icon: Icon, text, rightSlot }: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheets = useSheets();
  const { isGuest } = useTutorialProgress();

  const onPress = () => {
    if (isGuest) {
      sheets.present('tutorial-sheet');
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
        overflow: 'hidden',
      }}
    >
      <BlurView
        pointerEvents="none"
        blurTarget={blurTarget}
        blurMethod="dimezisBlurView"
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface.headerOverlay }]}
      />
      <View style={styles.container}>
        <View style={styles.title}>
          <Icon color={colors.brown[900]} size={32} strokeWidth={2.25} />
          <Typography variant="heading-lg" weight="black">
            {text}
          </Typography>
        </View>
        {rightSlot}
        {!rightSlot && !isGuest && (
          <PressableWithHaptics
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            hitSlop={20}
            scaleTo={0.9}
            onPress={onPress}
            style={styles.button}
          >
            <Typography variant="body-sm" weight="bold" color={colors.brown[900]}>
              Settings
            </Typography>
            <Cog color={colors.brown[900]} strokeWidth={2} size={24} />
          </PressableWithHaptics>
        )}
        {!rightSlot && isGuest && (
          <Button onPress={onPress} variant="primary" size="small" text={`Todo list`} leftIcon={{ Icon: ListTodo }} />
        )}
      </View>
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
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
});
