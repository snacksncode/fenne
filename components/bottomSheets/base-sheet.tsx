import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { ReactNode } from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sheets, useSheetInternal } from '@/lib/sheet-context';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

type SheetDetents = NonNullable<TrueSheetProps['detents']>;
type BaseSheetSizing = { type?: 'auto' } | { type: 'scrollable'; detents: SheetDetents };
type ExplicitFooter = { node: ReactNode; height: number };
const FOOTER_TOP_PADDING = 12;

type BaseSheetProps = Partial<Omit<TrueSheetProps, 'name' | 'children' | 'footer' | 'detents'>> & {
  sizing?: BaseSheetSizing;
  footer?: ExplicitFooter;
  children: ReactNode;
  id: keyof Sheets & string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const sheetFooter = {
  buttonRow: (node: ReactNode): ExplicitFooter => ({ node, height: 48 }),
};

export const BaseSheet = ({
  children,
  containerStyle,
  sizing = { type: 'auto' },
  footer,
  id,
  dismissible,
  draggable,
  onDidPresent,
  onDidDismiss,
  ...props
}: BaseSheetProps) => {
  const { handleDidDismiss } = useSheetInternal();
  const insets = useSafeAreaInsets();
  const isScrollable = sizing.type === 'scrollable';
  const { progress } = useReanimatedKeyboardAnimation();
  const footerKeyboardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: progress.value * 24 }] }));

  return (
    <TrueSheet
      name={id}
      backgroundColor="#FEF7EA"
      insetAdjustment="never"
      detents={isScrollable ? sizing.detents : ['auto']}
      scrollable={isScrollable}
      dimmed
      onDidPresent={(e) => {
        onDidPresent?.(e);
      }}
      onDidDismiss={(event) => {
        handleDidDismiss(id);
        onDidDismiss?.(event);
      }}
      dismissible={dismissible ?? true}
      draggable={draggable ?? true}
      grabber
      grabberOptions={{ width: 64, height: 4, topMargin: 16, color: colors.brown[800], adaptive: false }}
      {...props}
      footer={
        <Animated.View
          pointerEvents="auto"
          style={
            footer == null ? styles.emptyFooter : [styles.footer, { paddingBottom: insets.bottom }, footerKeyboardStyle]
          }
        >
          {footer?.node}
        </Animated.View>
      }
    >
      <View style={[styles.content, containerStyle]}>
        {children}
        <View style={{ height: footer != null ? footer.height + FOOTER_TOP_PADDING + insets.bottom : insets.bottom }} />
      </View>
    </TrueSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: FOOTER_TOP_PADDING,
  },
  emptyFooter: {
    height: 0,
  },
});
