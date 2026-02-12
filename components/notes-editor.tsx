import React, { useCallback, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { EnrichedTextInput } from 'react-native-enriched';
import type { EnrichedTextInputInstance, OnChangeStateEvent } from 'react-native-enriched';
import { Bold, Heading1, Heading2, Heading3, Italic, Link, List, ListOrdered, Underline } from 'lucide-react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';

type ToolbarButton = {
  icon: React.ElementType;
  stateKey: keyof OnChangeStateEvent;
  toggle: (ref: EnrichedTextInputInstance) => void;
};

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, stateKey: 'bold', toggle: (r) => r.toggleBold() },
  { icon: Italic, stateKey: 'italic', toggle: (r) => r.toggleItalic() },
  { icon: Underline, stateKey: 'underline', toggle: (r) => r.toggleUnderline() },
  { icon: ListOrdered, stateKey: 'orderedList', toggle: (r) => r.toggleOrderedList() },
  { icon: List, stateKey: 'unorderedList', toggle: (r) => r.toggleUnorderedList() },
  { icon: Heading1, stateKey: 'h1', toggle: (r) => r.toggleH1() },
  { icon: Heading2, stateKey: 'h2', toggle: (r) => r.toggleH2() },
  { icon: Heading3, stateKey: 'h3', toggle: (r) => r.toggleH3() },
  { icon: Link, stateKey: 'link', toggle: () => {} },
];

type NotesEditorProps = {
  defaultValue?: string;
  style?: StyleProp<ViewStyle>;
  ref?: React.Ref<EnrichedTextInputInstance>;
};

export function NotesEditor({ defaultValue, style, ref }: NotesEditorProps) {
  const editorRef = useRef<EnrichedTextInputInstance>(null);
  const selectionRef = useRef<{ start: number; end: number; text: string }>({ start: 0, end: 0, text: '' });
  const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(null);

  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const scrollViewWidth = useRef(0);
  const contentWidth = useRef(0);

  React.useImperativeHandle(ref, () => editorRef.current!, []);

  const updateShadows = useCallback((scrollX: number) => {
    setShowLeftShadow(scrollX > 2);
    const maxScroll = contentWidth.current - scrollViewWidth.current;
    setShowRightShadow(maxScroll > 2 && scrollX < maxScroll - 2);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<{ contentOffset: { x: number } }>) => {
      updateShadows(e.nativeEvent.contentOffset.x);
    },
    [updateShadows]
  );

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      scrollViewWidth.current = e.nativeEvent.layout.width;
      updateShadows(0);
    },
    [updateShadows]
  );

  const handleContentSizeChange = useCallback(
    (w: number) => {
      contentWidth.current = w;
      updateShadows(0);
    },
    [updateShadows]
  );

  const toolbar = (
    <View style={styles.toolbarWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbarContent}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {TOOLBAR_BUTTONS.map((btn) => {
          const state = stylesState?.[btn.stateKey];
          const isActive = state?.isActive ?? false;
          const isBlocking = state?.isBlocking ?? false;

          return (
            <PressableWithHaptics
              key={btn.stateKey}
              style={[
                styles.toolbarButton,
                isActive && styles.toolbarButtonActive,
                isBlocking && styles.toolbarButtonBlocked,
              ]}
              onPress={async () => {
                if (!isBlocking && editorRef.current) {
                  if (btn.stateKey === 'link') {
                    const { start, end, text } = selectionRef.current;
                    const url = await SheetManager.show('link-input-sheet', {
                      payload: { selectedText: text || undefined },
                    });
                    if (url && editorRef.current) {
                      editorRef.current.setLink(start, end, text, url);
                    }
                  } else {
                    btn.toggle(editorRef.current);
                  }
                }
              }}
              disabled={isBlocking}
              scaleTo={0.9}
            >
              <btn.icon size={18} color={isActive ? colors.brown[900] : colors.cream[100]} strokeWidth={2.5} />
            </PressableWithHaptics>
          );
        })}
      </ScrollView>
      {showLeftShadow && <View style={[styles.scrollShadow, styles.scrollShadowLeft]} pointerEvents="none" />}
      {showRightShadow && <View style={[styles.scrollShadow, styles.scrollShadowRight]} pointerEvents="none" />}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <EnrichedTextInput
        ref={editorRef}
        defaultValue={defaultValue}
        scrollEnabled={false}
        onChangeState={(e) => setStylesState(e.nativeEvent)}
        onChangeSelection={(e) => {
          selectionRef.current = {
            start: e.nativeEvent.start,
            end: e.nativeEvent.end,
            text: e.nativeEvent.text,
          };
        }}
        style={styles.editor}
        placeholderTextColor="#958270"
        placeholder="Add notes about this recipe..."
        cursorColor={colors.brown[900]}
        selectionColor={colors.orange[100]}
        htmlStyle={{
          h1: { fontSize: 24, bold: true },
          h2: { fontSize: 20, bold: true },
          h3: { fontSize: 18, bold: true },
          a: { color: colors.orange[600], textDecorationLine: 'underline' },
          ol: { markerColor: colors.brown[900] },
          ul: { bulletColor: colors.brown[900] },
        }}
      />
      {toolbar}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    overflow: 'hidden',
    minHeight: 150,
    backgroundColor: '#FEF2DD',
  },
  toolbarWrapper: {
    position: 'relative',
    backgroundColor: colors.brown[900],
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toolbarContent: {
    gap: 4,
  },
  toolbarButton: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  toolbarButtonActive: {
    backgroundColor: colors.cream[100],
  },
  toolbarButtonBlocked: {
    opacity: 0.3,
  },
  editor: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: colors.brown[900],
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
  },
  scrollShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  scrollShadowLeft: {
    left: 0,
    backgroundColor: colors.brown[900],
    opacity: 0.4,
  },
  scrollShadowRight: {
    right: 0,
    backgroundColor: colors.brown[900],
    opacity: 0.4,
  },
});
