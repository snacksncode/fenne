import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { ReactNode } from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sheets, useSheetInternal } from '@/lib/sheet-context';

type SheetDetents = NonNullable<TrueSheetProps['detents']>;
type BaseSheetSizing = { type?: 'auto' } | { type: 'scrollable'; detents: SheetDetents };
const FOOTER_TOP_PADDING = 12;
const FOOTER_CONTENT_HEIGHT = 48;
export const SHEET_FOOTER_HEIGHT = FOOTER_TOP_PADDING + FOOTER_CONTENT_HEIGHT;

type BaseSheetProps = Partial<Omit<TrueSheetProps, 'name' | 'children' | 'footer' | 'detents'>> & {
  sizing?: BaseSheetSizing;
  footer?: ReactNode;
  children: ReactNode;
  id: keyof Sheets & string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const sheetFooter = {
  buttonRow: (node: ReactNode) => node,
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
  const contentBottomPadding =
    footer != null ? FOOTER_CONTENT_HEIGHT + FOOTER_TOP_PADDING + insets.bottom : insets.bottom;

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
      footerOptions={{ keyboardOffset: -16, ...props.footerOptions }}
      footer={
        <View
          pointerEvents={footer == null ? 'none' : 'auto'}
          style={footer == null ? styles.emptyFooter : [styles.footer, { paddingBottom: insets.bottom }]}
        >
          {footer}
        </View>
      }
    >
      <View style={[styles.content, containerStyle]}>
        {children}
        <View style={{ height: contentBottomPadding }} />
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
