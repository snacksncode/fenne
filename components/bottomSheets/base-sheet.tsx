import ActionSheet, { ActionSheetProps } from 'react-native-actions-sheet';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BaseSheetProps = Partial<ActionSheetProps> & {
  noBottomGutter?: boolean;
  children: ReactNode;
  id: string;
};

export const BaseSheet = ({ children, containerStyle, noBottomGutter = false, ...props }: BaseSheetProps) => {
  const insets = useSafeAreaInsets();
  return (
    <ActionSheet
      gestureEnabled
      containerStyle={[styles.container, containerStyle]}
      indicatorStyle={styles.indicator}
      overlayColor={colors.brown[900]}
      defaultOverlayOpacity={0.75}
      useBottomSafeAreaPadding={false}
      {...props}
    >
      <View style={[styles.innerContainer, { paddingBottom: noBottomGutter ? 0 : insets.bottom }]}>{children}</View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF7EA',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  indicator: {
    width: 64,
    backgroundColor: colors.brown[800],
    height: 4,
    marginTop: 16,
    marginBottom: 16,
  },
  innerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
