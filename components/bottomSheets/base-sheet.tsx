import ActionSheet, { ActionSheetProps, ScrollView } from 'react-native-actions-sheet';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BaseSheetProps = Partial<ActionSheetProps> & {
  extraOverlay?: ReactNode;
  children: ReactNode;
  id: string;
};

const Container = ({ children, noBottomGutter = false }: { children: ReactNode; noBottomGutter?: boolean }) => {
  const insets = useSafeAreaInsets();
  return <View style={[styles.innerContainer, { paddingBottom: noBottomGutter ? 0 : insets.bottom }]}>{children}</View>;
};

const ScrollableContainer = ({
  children,
  noBottomGutter = false,
}: {
  children: ReactNode;
  noBottomGutter?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.innerContainer, { paddingBottom: noBottomGutter ? 0 : insets.bottom }]}
    >
      {children}
    </ScrollView>
  );
};

const BaseSheetRoot = ({ children, containerStyle, extraOverlay, ...props }: BaseSheetProps) => {
  return (
    <ActionSheet
      gestureEnabled
      containerStyle={[styles.container, containerStyle]}
      indicatorStyle={styles.indicator}
      overlayColor={colors.brown[900]}
      defaultOverlayOpacity={0.75}
      useBottomSafeAreaPadding={false}
      ExtraOverlayComponent={extraOverlay}
      {...props}
    >
      {children}
    </ActionSheet>
  );
};

export const BaseSheet = Object.assign(BaseSheetRoot, {
  Container,
  ScrollableContainer,
});

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
